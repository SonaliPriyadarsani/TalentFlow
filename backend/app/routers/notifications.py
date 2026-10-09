from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Notification, User
from ..schemas import NotificationResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# GET LOGGED-IN CANDIDATE'S NOTIFICATIONS
@router.get(
    "/",
    response_model=list[NotificationResponse]
)
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only candidates can access notifications

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.candidate_id == current_user.id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )

    return notifications


# MARK NOTIFICATION AS READ
@router.put(
    "/{notification_id}/read",
    response_model=NotificationResponse
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only candidates
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )

    # Find notification
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    # Candidate can only update THEIR notifications

    if notification.candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own notifications"
        )

    # Mark as read
    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification