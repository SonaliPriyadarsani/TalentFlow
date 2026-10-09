from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    Boolean,
    Date,
    Time
)
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)

    phone = Column(String(20), nullable=True)
    education = Column(String(255), nullable=True)
    skills = Column(String(500), nullable=True)
    experience = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)

    resume_filename = Column(String(255), nullable=True)
    resume_path = Column(String(500), nullable=True)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(150), nullable=False)

    description = Column(Text, nullable=False)

    location = Column(String(100), nullable=False)

    experience = Column(String(50), nullable=False)

    skills = Column(String(500), nullable=False)

    company = Column(String(150), nullable=False)

    recruiter_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    closing_date = Column(
        DateTime,
        nullable=True
    )
    job_type = Column(String(30), nullable=False, default="Full-time")

    deadline_email_sent = Column(
    Boolean,
    default=False,
    nullable=False
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    status = Column(
        String(30),
        default="Applied",
        nullable=False
    )

    applied_at = Column(
        DateTime,
        server_default=func.now()
    )

class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False
    )
    status = Column(String(30), nullable=False)
    changed_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

# INTERVIEWS
class Interview(Base):
    __tablename__ = "interviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False,
        unique=True
    )

    recruiter_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    interview_date = Column(
        Date,
        nullable=False
    )

    interview_time = Column(
        Time,
        nullable=False
    )

    mode = Column(
        String(30),
        nullable=False
    )

    meeting_link = Column(
        String(500),
        nullable=True
    )

    location = Column(
        String(255),
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    application_id = Column(
        Integer,
        ForeignKey("applications.id"),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    is_read = Column(
        Boolean,
        default=False,
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

# SAVED JOBS
class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "candidate_id",
            "job_id",
            name="unique_candidate_saved_job"
        ),
    )

# COMPANY PROFILE
class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)

    recruiter_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    company_name = Column(String(150), nullable=False)
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    location = Column(String(150), nullable=True)
    website = Column(String(255), nullable=True)
    company_email = Column(String(150), nullable=True)
    company_phone = Column(String(30), nullable=True)
    description = Column(Text, nullable=True)

    logo_filename = Column(String(255), nullable=True)
    logo_path = Column(String(500), nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )