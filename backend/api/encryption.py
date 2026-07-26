"""
Token encryption utilities using Fernet symmetric encryption.
The SLACK_TOKEN_ENCRYPTION_KEY must be set as an env var (never commit it).
Generate once via: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
"""
import logging
# pyrefly: ignore [missing-import]
from cryptography.fernet import Fernet, InvalidToken
from app.config import settings

logger = logging.getLogger(__name__)

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        key = settings.SLACK_TOKEN_ENCRYPTION_KEY
        if not key:
            logger.warning(
                "SLACK_TOKEN_ENCRYPTION_KEY is not set. Generating a transient fallback key. "
                "Note: Decryption will fail across server restarts unless you set this key."
            )
            # Generate a transient key for testing so it doesn't crash the server
            fallback_key = Fernet.generate_key().decode()
            _fernet = Fernet(fallback_key.encode())
        else:
            _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet


def encrypt_token(plaintext: str) -> str:
    """Encrypts a plaintext token, returns base64-encoded ciphertext."""
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_token(ciphertext: str) -> str:
    """Decrypts a Fernet-encrypted token back to plaintext."""
    f = _get_fernet()
    try:
        return f.decrypt(ciphertext.encode()).decode()
    except InvalidToken as e:
        logger.error("Failed to decrypt token — key may have rotated")
        raise ValueError("Token decryption failed") from e
