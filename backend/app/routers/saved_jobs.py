from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SavedJob, Job, User
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/saved-jobs",
    tags=["Saved Jobs"]
)

# SAVE JOB
@router.post("/{job_id}")
def save_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only candidates can save jobs
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can save jobs"
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

    # Check if already saved
    existing_saved_job = db.query(SavedJob).filter(
        SavedJob.candidate_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()

    if existing_saved_job:
        raise HTTPException(
            status_code=400,
            detail="Job is already saved"
        )

    # Create saved job
    new_saved_job = SavedJob(
        candidate_id=current_user.id,
        job_id=job_id
    )

    db.add(new_saved_job)
    db.commit()
    db.refresh(new_saved_job)

    return {
        "message": "Job saved successfully",
        "job_id": job_id
    }


# GET SAVED JOBS
@router.get("/")
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only candidates
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )

    # Get candidate's saved jobs
    saved_jobs = (
        db.query(SavedJob, Job)
        .join(
            Job,
            SavedJob.job_id == Job.id
        )
        .filter(
            SavedJob.candidate_id == current_user.id
        )
        .order_by(
            SavedJob.created_at.desc()
        )
        .all()
    )

    return [
        {
            "id": saved_job.id,
            "job_id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "experience": job.experience,
            "skills": job.skills,
            "company": job.company,
            "recruiter_id": job.recruiter_id,
            "created_at": job.created_at,
            "saved_at": saved_job.created_at
        }
        for saved_job, job in saved_jobs
    ]


# REMOVE SAVED JOB
@router.delete("/{job_id}")
def remove_saved_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Only candidates
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Candidate access required"
        )

    # Find saved job
    saved_job = db.query(SavedJob).filter(
        SavedJob.candidate_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()

    if not saved_job:
        raise HTTPException(
            status_code=404,
            detail="Saved job not found"
        )

    # Delete saved job
    db.delete(saved_job)
    db.commit()

    return {
        "message": "Job removed from saved jobs"
    }