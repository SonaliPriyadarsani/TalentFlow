from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, User, Application
from ..schemas import JobCreate, JobResponse
from ..role_dependencies import require_recruiter


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)
@router.post(
    "/",
    response_model=JobResponse
)
def create_job(
    job: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):

    new_job = Job(
    title=job.title,
    description=job.description,
    location=job.location,
    experience=job.experience,
    skills=job.skills,
    company=job.company,
    recruiter_id=current_user.id,
    closing_date=job.closing_date,
    job_type=job.job_type
)

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job

@router.get("/", response_model=list[JobResponse])
def get_all_jobs(
    db: Session = Depends(get_db)
):

    jobs = db.query(Job).order_by(
        Job.created_at.desc()
    ).all()

    return jobs

@router.get(
    "/recruiter/my",
    response_model=list[JobResponse]
)
def get_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):

    jobs = db.query(Job).filter(
        Job.recruiter_id == current_user.id
    ).order_by(
        Job.created_at.desc()
    ).all()

    return jobs

@router.get(
    "/{job_id}",
    response_model=JobResponse
)
def get_job(
    job_id: int,
    db: Session = Depends(get_db)
):

    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    return job

@router.put(
    "/{job_id}",
    response_model=JobResponse
)
def update_job(
    job_id: int,
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):

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
            status_code=403,
            detail="You can only update your own jobs"
        )

    job.title = job_data.title
    job.description = job_data.description
    job.location = job_data.location
    job.experience = job_data.experience
    job.skills = job_data.skills
    job.company = job_data.company
    job.closing_date = job_data.closing_date
    job.job_type = job_data.job_type
    db.commit()
    db.refresh(job)

    return job

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):

    job = db.query(Job).filter(
        Job.id == job_id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )

    # Recruiter can delete only their own job
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own jobs"
        )

    # Delete applications belonging to this job first
    db.query(Application).filter(
        Application.job_id == job_id
    ).delete(
        synchronize_session=False
    )

    # Now delete the job
    db.delete(job)

    db.commit()

    return {
        "message": "Job deleted successfully"
    }