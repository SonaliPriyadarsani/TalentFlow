from fastapi import Depends, HTTPException, status

from .dependencies import get_current_user
from .models import User


def require_recruiter(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required"
        )

    return current_user


def require_candidate(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )

    return current_user

