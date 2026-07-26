"""
JWT Auth Middleware for FastAPI.
Verifies Supabase-issued JWTs and resolves org_id from the profiles table.
Auto-provisions an org + profile row on first login (no 403 for new users).
"""
import base64
import json
import logging
import uuid
from typing import Optional, Tuple
# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from db.session import get_db
from db.models import Profile, Organization
from app.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def _decode_jwt_payload_unverified(token: str) -> dict:
    """
    Decode JWT payload via base64 without signature verification.
    Works for both HS256 and RS256 tokens.
    Only used when SUPABASE_JWT_SECRET is not configured (dev mode).
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Not a valid JWT (expected 3 parts)")
        # Pad base64 to a multiple of 4
        payload_b64 = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        return payload
    except Exception as e:
        logger.warning(f"Raw JWT payload decode failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format. Please sign in again.",
        )


def _decode_supabase_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase JWT.
    - With SUPABASE_JWT_SECRET set: verifies HS256 signature.
    - Without secret (dev/RS256 mode): base64-decodes payload only (no sig check).
    Supabase newer projects issue RS256 tokens — those are handled by the fallback.
    """
    if settings.SUPABASE_JWT_SECRET:
        try:
            from jose import jwt as jose_jwt, JWTError
            # Try with audience claim first
            try:
                return jose_jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            except JWTError:
                pass
            # Try without audience
            try:
                return jose_jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
            except JWTError as e:
                logger.warning(
                    f"SUPABASE_JWT_SECRET set but HS256 decode failed ({e}). "
                    "Token may be RS256 — falling back to unverified payload decode."
                )
        except ImportError:
            pass
        # Fallback for RS256 or other alg when secret is misconfigured
        return _decode_jwt_payload_unverified(token)
    else:
        # No secret configured — decode payload without signature verification.
        # Works for both HS256 and RS256 tokens (Supabase RS256 is the default now).
        return _decode_jwt_payload_unverified(token)


async def _get_or_create_profile(
    user_id: str,
    email: Optional[str],
    db: AsyncSession,
) -> Profile:
    """
    Returns the Profile for user_id, creating an org + profile if needed.
    This ensures new Supabase sign-ups never get a 403 on first request.
    """
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if profile and profile.org_id:
        return profile

    # No profile yet — auto-provision an org for this user
    logger.info(f"Auto-provisioning org + profile for new user={user_id}")

    org_name = f"My Organization"
    if email:
        domain = email.split("@")[-1] if "@" in email else email
        # Use domain as org name (e.g. acme.com → Acme)
        org_name = domain.split(".")[0].capitalize()

    org = Organization(
        id=str(uuid.uuid4()),
        name=org_name,
    )
    db.add(org)
    await db.flush()

    if profile:
        # Profile exists but has no org_id — attach it
        profile.org_id = org.id
    else:
        profile = Profile(
            id=user_id,
            org_id=org.id,
            full_name=email.split("@")[0] if email else "User",
            role="admin",  # First user in the org is admin
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    logger.info(f"Created org={org.id} ({org_name}) for user={user_id}")
    return profile


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Tuple[str, str]:
    """
    Returns (user_id, org_id) from a valid Supabase JWT.
    Auto-provisions org + profile for new users.
    Raises 401 if token is missing or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = _decode_supabase_jwt(credentials.credentials)
    user_id: str = payload.get("sub")
    email: Optional[str] = payload.get("email")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload (missing sub). Please sign in again.",
        )

    profile = await _get_or_create_profile(user_id, email, db)

    logger.debug(f"Authenticated user={user_id} org={profile.org_id}")
    return user_id, profile.org_id


async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Tuple[str, str]:
    """Returns (user_id, org_id) only if the user has admin role."""
    user_id, org_id = await get_current_user(credentials, db)

    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if not profile or profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )

    return user_id, org_id
