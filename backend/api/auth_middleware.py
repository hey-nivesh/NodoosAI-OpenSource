"""
JWT Auth Middleware for FastAPI.
Verifies Supabase-issued JWTs and resolves org_id from the profiles table.
"""
import logging
from typing import Optional, Tuple
# pyrefly: ignore [missing-import]
from fastapi import Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from db.session import get_db
from db.models import Profile
from app.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


def _decode_supabase_jwt(token: str) -> dict:
    """
    Decode and verify a Supabase JWT.
    Uses SUPABASE_JWT_SECRET if set, otherwise falls back to
    decoding without verification (for local dev without the secret).
    """
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload
        except JWTError as e:
            logger.warning(f"JWT decode error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
    else:
        # Dev fallback: decode without verification (never do this in prod)
        try:
            payload = jwt.decode(token, "", options={"verify_signature": False})
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Tuple[str, str]:
    """
    Returns (user_id, org_id) from a valid Supabase JWT.
    Raises 401 if missing/invalid, 403 if no profile found.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
        )

    payload = _decode_supabase_jwt(credentials.credentials)
    user_id: str = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Resolve org_id from profiles table
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if not profile or not profile.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile or organization found for this user",
        )

    logger.debug(f"Authenticated user={user_id} org={profile.org_id}")
    return user_id, profile.org_id


async def get_current_admin(
    current_user: Tuple[str, str] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Tuple[str, str]:
    """Returns (user_id, org_id) only if the user has admin role."""
    user_id, org_id = current_user
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()

    if not profile or profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )

    return user_id, org_id
