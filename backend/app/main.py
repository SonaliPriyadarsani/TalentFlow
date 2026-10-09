from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from .database import SessionLocal
from .models import Job, User
from .email_service import send_job_deadline_email

from .routers import (
    auth,
    jobs,
    applications,
    notifications,
    saved_jobs
)


# CREATE FASTAPI APP
app = FastAPI()


# CORS

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://talent-flow-xi-seven.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REGISTER ROUTERS
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(notifications.router)
app.include_router(saved_jobs.router)


# JOB DEADLINE EMAIL CHECK

def check_expired_jobs():

    db = SessionLocal()

    try:

        jobs_list = db.query(Job).filter(
            Job.closing_date.isnot(None),
            Job.deadline_email_sent == False
        ).all()

        for job in jobs_list:

            # Convert closing date to date
            if hasattr(job.closing_date, "date"):
                deadline = job.closing_date.date()
            else:
                deadline = job.closing_date

            # Deadline is finished only AFTER the closing date

            if datetime.now().date() > deadline:

                recruiter = db.query(User).filter(
                    User.id == job.recruiter_id,
                    User.role == "recruiter"
                ).first()

                if recruiter:

                    email_sent = send_job_deadline_email(
                        recruiter_email=recruiter.email,
                        recruiter_name=recruiter.name,
                        job_title=job.title,
                        company_name=job.company,
                        closing_date=deadline
                    )

                    # Mark as sent only if email actually succeeded

                    if email_sent:

                        job.deadline_email_sent = True

                        db.commit()

    except Exception as error:

        db.rollback()

        print(
            f"Deadline email check failed: {error}"
        )

    finally:

        db.close()