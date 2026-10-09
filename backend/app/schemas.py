from pydantic import BaseModel, EmailStr
from datetime import datetime, date, time


# User Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    phone: str | None = None
    education: str | None = None
    skills: str | None = None
    experience: str | None = None
    bio: str | None = None
    resume_filename: str | None = None

    class Config:
        from_attributes = True

class CandidateProfileUpdate(BaseModel):
    name: str
    phone: str | None = None
    education: str | None = None
    skills: str | None = None
    experience: str | None = None
    bio: str | None = None


class CandidateProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    education: str | None = None
    skills: str | None = None
    experience: str | None = None
    bio: str | None = None
    resume_filename: str | None = None

    class Config:
        from_attributes = True

# Login Schema

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Job Schemas
class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    experience: str
    skills: str
    company: str
    closing_date: datetime
    job_type: str = "Full-time"

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    location: str
    experience: str
    skills: str
    company: str
    recruiter_id: int
    created_at: datetime
    closing_date: datetime | None
    job_type: str

    class Config:
        from_attributes = True


# Application Schemas

class ApplicationCreate(BaseModel):
    pass


class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: EmailStr
    status: str
    applied_at: datetime

    class Config:
        from_attributes = True
        
class ApplicationStatusUpdate(BaseModel):
    status: str

class ApplicationTimelineResponse(BaseModel):
    id: int
    application_id: int
    status: str
    changed_at: datetime

    class Config:
        from_attributes = True

# Interview Schemas

class InterviewCreate(BaseModel):
    interview_date: date
    interview_time: time
    mode: str
    meeting_link: str | None = None
    location: str | None = None
    notes: str | None = None


class InterviewNotesUpdate(BaseModel):
    notes: str | None = None


class InterviewResponse(BaseModel):
    id: int
    application_id: int
    job_id: int
    recruiter_id: int
    candidate_id: int

    interview_date: date
    interview_time: time

    mode: str

    meeting_link: str | None = None
    location: str | None = None

    notes: str | None = None

    created_at: datetime
    updated_at: datetime | None = None

    candidate_name: str | None = None
    candidate_email: EmailStr | None = None

    job_title: str | None = None
    company: str | None = None

# Company Profile Schemas
class CompanyProfileUpdate(BaseModel):
    company_name: str
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    website: str | None = None
    company_email: EmailStr | None = None
    company_phone: str | None = None
    description: str | None = None


class CompanyProfileResponse(BaseModel):
    id: int
    recruiter_id: int
    company_name: str
    industry: str | None = None
    company_size: str | None = None
    location: str | None = None
    website: str | None = None
    company_email: EmailStr | None = None
    company_phone: str | None = None
    description: str | None = None
    logo_filename: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    application_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True