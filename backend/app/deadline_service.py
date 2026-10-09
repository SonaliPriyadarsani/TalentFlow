from datetime import datetime

from .database import SessionLocal
from .models import Job, User

from .email_service import send_job_deadline_email


def check_expired_jobs():

    db = SessionLocal()

    try:

        jobs = db.query(Job).filter(
            Job.closing_date.isnot(None),
            Job.deadline_email_sent == False
        ).all()

        for job in jobs:

            # Convert closing date to date
            if hasattr(job.closing_date, "date"):
                deadline = job.closing_date.date()
            else:
                deadline = job.closing_date

            # Deadline is finished only AFTER the closing date.

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

                    # Mark as sent only if email actually succeeded.
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