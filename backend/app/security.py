import os
import bcrypt
import hashlib

from dotenv import load_dotenv
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)



# PASSWORD VERIFICATION
def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


# ACCESS TOKEN
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# DECODE ACCESS TOKEN
def decode_access_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return payload

    except JWTError:

        return None


# PASSWORD RESET TOKEN
def create_password_reset_token(
    user_id: int,
    password_hash: str
):

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=30
    )

    # Create a fingerprint of the current password hash. When the password changes, this fingerprint changes, automatically invalidating the old reset token.
    password_fingerprint = hashlib.sha256(
        password_hash.encode("utf-8")
    ).hexdigest()

    payload = {
        "sub": str(user_id),
        "type": "password_reset",
        "pwd": password_fingerprint,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# VERIFY PASSWORD RESET TOKEN
def decode_password_reset_token(
    token: str,
    current_password_hash: str
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Check token type
        if payload.get("type") != "password_reset":
            return None

        user_id = payload.get("sub")

        token_password_fingerprint = payload.get("pwd")

        if not user_id or not token_password_fingerprint:
            return None

        # Calculate fingerprint of the user's CURRENT password
        current_password_fingerprint = hashlib.sha256(
            current_password_hash.encode("utf-8")
        ).hexdigest()

        # If password has changed, old token becomes invalid
        if token_password_fingerprint != current_password_fingerprint:
            return None

        return payload

    except JWTError:

        return None