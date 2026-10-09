from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, time


from ..database import get_db
from ..schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    ApplicationTimelineResponse,
    InterviewCreate,
    InterviewNotesUpdate,
    InterviewResponse
)
from ..models import (
    User,
    Job,
    Application,
    ApplicationStatusHistory,
    Interview,
    Notification
)
from ..dependencies import get_current_user


from ..email_service import (
    send_status_change_email,
    send_selection_email,
    send_new_notification_email,
    send_new_application_email
)


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


# CANDIDATE APPLY FOR JOB

@router.post("/{job_id}", response_model=ApplicationResponse)
def apply_for_job(
    job_id: int,
    application: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can apply for jobs"
        )

    # Check job
    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Check closing date
    # Closing date blocks NEW applications only.
    if job.closing_date:

        if hasattr(job.closing_date, "date"):
            deadline = job.closing_date.date()
        else:
            deadline = job.closing_date

        from datetime import date

        if date.today() > deadline:
            raise HTTPException(
                status_code=400,
                detail="This job application has closed"
            )

    # Check duplicate application
    existing_application = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == current_user.id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job"
        )

    # Create application
    new_application = Application(
        job_id=job_id,
        candidate_id=current_user.id,
        status="Applied"
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    # CREATE FIRST TIMELINE ENTRY
    timeline_entry = ApplicationStatusHistory(
        application_id=new_application.id,
        status="Applied"
    )

    db.add(timeline_entry)
    db.commit()

    # Find recruiter
    recruiter = db.query(User).filter(
        User.id == job.recruiter_id,
        User.role == "recruiter"
    ).first()

    # Send application email to recruiter

    if recruiter:

        send_new_application_email(
            recruiter_email=recruiter.email,
            recruiter_name=recruiter.name,
            candidate_name=current_user.name,
            candidate_email=current_user.email,
            job_title=job.title,
            company_name=job.company
        )

    # Return candidate details
    return {
        "id": new_application.id,
        "job_id": new_application.job_id,
        "candidate_id": current_user.id,
        "candidate_name": current_user.name,
        "candidate_email": current_user.email,
        "status": new_application.status,
        "applied_at": new_application.applied_at
    }


# GET APPLICATIONS FOR RECRUITER'S OWN JOB
@router.get(
    "/job/{job_id}",
    response_model=list[ApplicationResponse]
)
def get_job_applications(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required"
        )

    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view applications for your own jobs"
        )

    results = (
        db.query(Application, User)
        .join(
            User,
            Application.candidate_id == User.id
        )
        .filter(
            Application.job_id == job_id
        )
        .all()
    )

    return [
        {
            "id": application.id,
            "job_id": application.job_id,
            "candidate_id": application.candidate_id,
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "status": application.status,
            "applied_at": application.applied_at
        }
        for application, candidate in results
    ]


# GET LOGGED-IN CANDIDATE'S APPLICATIONS
@router.get(
    "/candidate/{candidate_id}",
    response_model=list[ApplicationResponse]
)
def get_candidate_applications(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )

    if candidate_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications"
        )

    results = (
        db.query(Application, User)
        .join(
            User,
            Application.candidate_id == User.id
        )
        .filter(
            Application.candidate_id == current_user.id
        )
        .all()
    )

    return [
        {
            "id": application.id,
            "job_id": application.job_id,
            "candidate_id": application.candidate_id,
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "status": application.status,
            "applied_at": application.applied_at
        }
        for application, candidate in results
    ]


# GET APPLICATION TIMELINE
@router.get(
    "/timeline/{application_id}",
    response_model=list[ApplicationTimelineResponse]
)
def get_application_timeline(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only candidates can view timeline
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can view application timeline"
        )

    # Find application
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.candidate_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Get timeline
    timeline = (
        db.query(ApplicationStatusHistory)
        .filter(
            ApplicationStatusHistory.application_id == application_id
        )
        .order_by(
            ApplicationStatusHistory.changed_at.asc()
        )
        .all()
    )

    return timeline


# UPDATE APPLICATION STATUS
@router.put(
    "/{application_id}/status",
    response_model=ApplicationResponse
)
def update_application_status(
    application_id: int,
    status_data: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only recruiters
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Recruiter access required"
        )

    # Find application
    application = db.query(Application).filter(
        Application.id == application_id
    ).first()

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    # Find job
    job = db.query(Job).filter(
        Job.id == application.job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )


    # Security check
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update applications for your own jobs"
        )

    # Allowed statuses
    allowed_statuses = [
        "Applied",
        "Shortlisted",
        "Interview",
        "Selected",
        "Rejected"
    ]

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid application status"
        )

    # Check status change
    old_status = application.status
    new_status = status_data.status

    # Update status
    application.status = new_status

    db.commit()
    db.refresh(application)

    # Only process when status actually changes
    if old_status != new_status:

        # CREATE TIMELINE ENTRY
        timeline_entry = ApplicationStatusHistory(
            application_id=application.id,
            status=new_status
        )

        db.add(timeline_entry)
        db.commit()

        # Find candidate
        candidate = db.query(User).filter(
            User.id == application.candidate_id,
            User.role == "candidate"
        ).first()

        if candidate:

            # Existing in-app notification
            notification_message = (
                f"Your application for '{job.title}' "
                f"has been updated to {new_status}."
            )

            notification = Notification(
                candidate_id=application.candidate_id,
                application_id=application.id,
                message=notification_message,
                is_read=False
            )

            db.add(notification)
            db.commit()

            # General status email
            send_status_change_email(
                candidate_email=candidate.email,
                candidate_name=candidate.name,
                job_title=job.title,
                company_name=job.company,
                new_status=new_status
            )

            # Special Selected email
            if new_status == "Selected":

                send_selection_email(
                    candidate_email=candidate.email,
                    candidate_name=candidate.name,
                    job_title=job.title,
                    company_name=job.company
                )

            # New notification email
            send_new_notification_email(
                candidate_email=candidate.email,
                candidate_name=candidate.name,
                notification_message=notification_message
            )

    # Get candidate for response

    candidate = db.query(User).filter(
        User.id == application.candidate_id
    ).first()

    # Return complete response
    return {
        "id": application.id,
        "job_id": application.job_id,
        "candidate_id": application.candidate_id,
        "candidate_name": candidate.name,
        "candidate_email": candidate.email,
        "status": application.status,
        "applied_at": application.applied_at
    }


# SCHEDULE INTERVIEW
@router.post(
    "/interview/{application_id}",
    response_model=InterviewResponse
)
def schedule_interview(
    application_id: int,
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only recruiters can schedule interviews
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can schedule interviews."
        )

    # Find application
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    # Find related job
    job = (
        db.query(Job)
        .filter(
            Job.id == application.job_id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    # Verify recruiter owns this job
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only schedule interviews for your own jobs."
        )

    # Check if interview already exists
    existing_interview = (
        db.query(Interview)
        .filter(
            Interview.application_id == application_id
        )
        .first()
    )

    if existing_interview:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An interview is already scheduled. Use reschedule instead."
        )

    # Validate mode
    allowed_modes = [
        "Online",
        "In-person"
    ]

    if interview_data.mode not in allowed_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview mode must be Online or In-person."
        )

    # Online requires meeting link
    if (
        interview_data.mode == "Online"
        and not interview_data.meeting_link
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting link is required for an online interview."
        )

    # In-person requires location
    if (
        interview_data.mode == "In-person"
        and not interview_data.location
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location is required for an in-person interview."
        )

    # Prevent scheduling in the past
    interview_datetime = datetime.combine(
        interview_data.interview_date,
        interview_data.interview_time
    )

    if interview_datetime < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview date and time cannot be in the past."
        )

    # Create interview
    interview = Interview(
        application_id=application.id,
        recruiter_id=current_user.id,
        candidate_id=application.candidate_id,
        interview_date=interview_data.interview_date,
        interview_time=interview_data.interview_time,
        mode=interview_data.mode,
        meeting_link=interview_data.meeting_link,
        location=interview_data.location,
        notes=interview_data.notes
    )

    db.add(interview)

    # Candidate notification
    candidate = (
        db.query(User)
        .filter(
            User.id == application.candidate_id
        )
        .first()
    )

    notification = Notification(
        candidate_id=application.candidate_id,
        application_id=application.id,
        message=(
            f"Interview scheduled for {job.title} at "
            f"{interview_data.interview_date.strftime('%d %b %Y')} "
            f"at {interview_data.interview_time.strftime('%I:%M %p')}. "
            f"Mode: {interview_data.mode}."
        ),
        is_read=False
    )

    db.add(notification)

    db.commit()
    db.refresh(interview)

    return {
        "id": interview.id,
        "application_id": interview.application_id,
        "job_id": job.id,
        "recruiter_id": interview.recruiter_id,
        "candidate_id": interview.candidate_id,
        "interview_date": interview.interview_date,
        "interview_time": interview.interview_time,
        "mode": interview.mode,
        "meeting_link": interview.meeting_link,
        "location": interview.location,
        "notes": interview.notes,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "candidate_name": candidate.name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "job_title": job.title,
        "company": job.company
    }


# GET INTERVIEWS FOR RECRUITER JOB
@router.get(
    "/interview/job/{job_id}",
    response_model=list[InterviewResponse]
)
def get_job_interviews(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view job interviews."
        )

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view interviews for your own jobs."
        )

    interviews = (
        db.query(
            Interview,
            Application,
            User
        )
        .join(
            Application,
            Interview.application_id == Application.id
        )
        .join(
            User,
            Interview.candidate_id == User.id
        )
        .filter(
            Interview.recruiter_id == current_user.id,
            Application.job_id == job_id
        )
        .order_by(
            Interview.interview_date.asc(),
            Interview.interview_time.asc()
        )
        .all()
    )

    result = []

    for interview, application, candidate in interviews:

        result.append({
            "id": interview.id,
            "application_id": interview.application_id,
            "job_id": job.id,
            "recruiter_id": interview.recruiter_id,
            "candidate_id": interview.candidate_id,
            "interview_date": interview.interview_date,
            "interview_time": interview.interview_time,
            "mode": interview.mode,
            "meeting_link": interview.meeting_link,
            "location": interview.location,
            "notes": interview.notes,
            "created_at": interview.created_at,
            "updated_at": interview.updated_at,
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "job_title": job.title,
            "company": job.company
        })

    return result


# GET CANDIDATE INTERVIEWS
@router.get(
    "/interview/candidate",
    response_model=list[InterviewResponse]
)
def get_candidate_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can view their interviews."
        )

    interviews = (
        db.query(
            Interview,
            Application,
            Job
        )
        .join(
            Application,
            Interview.application_id == Application.id
        )
        .join(
            Job,
            Application.job_id == Job.id
        )
        .filter(
            Interview.candidate_id == current_user.id
        )
        .order_by(
            Interview.interview_date.asc(),
            Interview.interview_time.asc()
        )
        .all()
    )

    result = []

    for interview, application, job in interviews:

        result.append({
            "id": interview.id,
            "application_id": interview.application_id,
            "job_id": job.id,
            "recruiter_id": interview.recruiter_id,
            "candidate_id": interview.candidate_id,
            "interview_date": interview.interview_date,
            "interview_time": interview.interview_time,
            "mode": interview.mode,
            "meeting_link": interview.meeting_link,
            "location": interview.location,
            "notes": interview.notes,
            "created_at": interview.created_at,
            "updated_at": interview.updated_at,
            "candidate_name": current_user.name,
            "candidate_email": current_user.email,
            "job_title": job.title,
            "company": job.company
        })

    return result


# RESCHEDULE INTERVIEW
@router.put(
    "/interview/{interview_id}",
    response_model=InterviewResponse
)
def reschedule_interview(
    interview_id: int,
    interview_data: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can reschedule interviews."
        )

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )

    if interview.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reschedule your own interviews."
        )

    application = (
        db.query(Application)
        .filter(
            Application.id == interview.application_id
        )
        .first()
    )

    job = (
        db.query(Job)
        .filter(
            Job.id == application.job_id
        )
        .first()
    )

    candidate = (
        db.query(User)
        .filter(
            User.id == interview.candidate_id
        )
        .first()
    )

    allowed_modes = [
        "Online",
        "In-person"
    ]

    if interview_data.mode not in allowed_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview mode must be Online or In-person."
        )

    if (
        interview_data.mode == "Online"
        and not interview_data.meeting_link
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting link is required for an online interview."
        )

    if (
        interview_data.mode == "In-person"
        and not interview_data.location
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location is required for an in-person interview."
        )

    interview_datetime = datetime.combine(
        interview_data.interview_date,
        interview_data.interview_time
    )

    if interview_datetime < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview date and time cannot be in the past."
        )

    interview.interview_date = interview_data.interview_date
    interview.interview_time = interview_data.interview_time
    interview.mode = interview_data.mode
    interview.meeting_link = interview_data.meeting_link
    interview.location = interview_data.location
    interview.notes = interview_data.notes

    notification = Notification(
        candidate_id=interview.candidate_id,
        application_id=interview.application_id,
        message=(
            f"Your interview for {job.title} has been rescheduled to "
            f"{interview_data.interview_date.strftime('%d %b %Y')} "
            f"at {interview_data.interview_time.strftime('%I:%M %p')}. "
            f"Mode: {interview_data.mode}."
        ),
        is_read=False
    )

    db.add(notification)

    db.commit()
    db.refresh(interview)

    return {
        "id": interview.id,
        "application_id": interview.application_id,
        "job_id": job.id,
        "recruiter_id": interview.recruiter_id,
        "candidate_id": interview.candidate_id,
        "interview_date": interview.interview_date,
        "interview_time": interview.interview_time,
        "mode": interview.mode,
        "meeting_link": interview.meeting_link,
        "location": interview.location,
        "notes": None,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "candidate_name": candidate.name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "job_title": job.title,
        "company": job.company
    }


# UPDATE RECRUITER INTERVIEW NOTES

@router.put(
    "/interview/{interview_id}/notes",
    response_model=InterviewResponse
)
def update_interview_notes(
    interview_id: int,
    notes_data: InterviewNotesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Only recruiters can update interview notes

    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can update interview notes."
        )

    # Find interview

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id
        )
        .first()
    )

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found."
        )

    # Verify recruiter owns this interview
    if interview.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update notes for your own interviews."
        )

    # Find application
    application = (
        db.query(Application)
        .filter(
            Application.id == interview.application_id
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    # Find job
    job = (
        db.query(Job)
        .filter(
            Job.id == application.job_id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    # Find candidate
    candidate = (
        db.query(User)
        .filter(
            User.id == interview.candidate_id
        )
        .first()
    )

    # Update notes
    if notes_data.notes is not None:
        cleaned_notes = notes_data.notes.strip()

        interview.notes = (
            cleaned_notes
            if cleaned_notes
            else None
        )

    else:
        interview.notes = None

    db.commit()
    db.refresh(interview)

    # Return updated interview
    return {
        "id": interview.id,
        "application_id": interview.application_id,
        "job_id": job.id,
        "recruiter_id": interview.recruiter_id,
        "candidate_id": interview.candidate_id,
        "interview_date": interview.interview_date,
        "interview_time": interview.interview_time,
        "mode": interview.mode,
        "meeting_link": interview.meeting_link,
        "location": interview.location,
        "notes": interview.notes,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "candidate_name": candidate.name if candidate else None,
        "candidate_email": candidate.email if candidate else None,
        "job_title": job.title,
        "company": job.company
    }