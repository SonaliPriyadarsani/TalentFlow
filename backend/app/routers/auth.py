from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt

import bcrypt
import os
import uuid

from fastapi.responses import FileResponse

from ..role_dependencies import require_recruiter
from ..database import get_db
from ..models import User, CompanyProfile
from ..schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    CandidateProfileUpdate,
    CandidateProfileResponse,
    CompanyProfileUpdate,
    CompanyProfileResponse,
)
from ..security import (
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from ..dependencies import get_current_user
from ..email_service import (
    send_registration_email,
    send_login_email,
    send_password_reset_email,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# CHANGE PASSWORD SCHEMA

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


# FORGOT / RESET PASSWORD SCHEMAS

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


# FORGOT PASSWORD

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.email == request.email
    ).first()

    success_message = (
        "If an account with that email exists, "
        "a password reset link has been sent."
    )

    if not user:
        return {
            "message": success_message
        }

    reset_token = create_password_reset_token(
        user_id=user.id,
        password_hash=user.password,
    )

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    )

    reset_link = (
        f"{frontend_url}/?reset_token={reset_token}"
    )

    send_password_reset_email(
        name=user.name,
        email=user.email,
        reset_link=reset_link,
    )

    return {
        "message": success_message
    }


# RESET PASSWORD

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters long.",
        )

    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="New password and confirm password do not match.",
        )

    try:
        payload = jwt.decode(
            request.token,
            os.getenv("SECRET_KEY"),
            algorithms=[
                os.getenv("ALGORITHM", "HS256")
            ],
        )

        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired password reset link.",
            )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired password reset link.",
            )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link.",
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link.",
        )

    verified_payload = decode_password_reset_token(
        request.token,
        user.password,
    )

    if not verified_payload:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link.",
        )

    if verify_password(
        request.new_password,
        user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from your current password.",
        )

    hashed_password = bcrypt.hashpw(
        request.new_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    user.password = hashed_password

    db.commit()
    db.refresh(user)

    return {
        "message": (
            "Password reset successfully! "
            "You can now log in with your new password."
        )
    }

# REGISTER
@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_registration_email(
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
    )

    return new_user


# LOGIN
@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(
        user.password,
        existing_user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={
            "sub": str(existing_user.id),
            "role": existing_user.role,
        }
    )

    send_login_email(
        name=existing_user.name,
        email=existing_user.email,
        role=existing_user.role,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# CHANGE PASSWORD
@router.post("/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(
        password_data.current_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    if (
        password_data.new_password
        != password_data.confirm_password
    ):
        raise HTTPException(
            status_code=400,
            detail="New password and confirm password do not match.",
        )

    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="New password must be at least 8 characters long.",
        )

    if verify_password(
        password_data.new_password,
        current_user.password,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from your current password.",
        )

    hashed_password = bcrypt.hashpw(
        password_data.new_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    current_user.password = hashed_password

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Password changed successfully!"
    }


# GET MY PROFILE
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# UPLOAD RESUME
@router.post("/profile/resume")
async def upload_resume(
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Candidate access required",
        )

    if not resume.filename:
        raise HTTPException(
            status_code=400,
            detail="Please select a resume file",
        )

    file_extension = os.path.splitext(
        resume.filename
    )[1].lower()

    if file_extension != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resume files are allowed",
        )

    upload_directory = "resumes"

    os.makedirs(
        upload_directory,
        exist_ok=True,
    )

    unique_filename = (
        f"{current_user.id}_"
        f"{uuid.uuid4().hex}.pdf"
    )

    file_path = os.path.join(
        upload_directory,
        unique_filename,
    )

    try:
        with open(file_path, "wb") as file:
            while True:
                chunk = await resume.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                file.write(chunk)

    except Exception as error:
        print(
            "Error saving resume:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to upload resume",
        )

    # Delete previous resume
    if (
        current_user.resume_path
        and os.path.exists(
            current_user.resume_path
        )
    ):
        os.remove(
            current_user.resume_path
        )

    current_user.resume_filename = resume.filename
    current_user.resume_path = file_path

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Resume uploaded successfully!",
        "resume_filename": current_user.resume_filename,
    }


# GET CANDIDATE PROFILE
@router.get(
    "/profile",
    response_model=CandidateProfileResponse,
)
def get_candidate_profile(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Candidate access required",
        )

    return current_user


# GET CANDIDATE RESUME FOR RECRUITER
@router.get(
    "/candidate/{candidate_id}/resume"
)
def get_candidate_resume(
    candidate_id: int,
    current_user: User = Depends(require_recruiter),
    db: Session = Depends(get_db),
):
    candidate = db.query(User).filter(
        User.id == candidate_id,
        User.role == "candidate",
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    if not candidate.resume_path:
        raise HTTPException(
            status_code=404,
            detail="Resume not uploaded",
        )

    if not os.path.exists(
        candidate.resume_path
    ):
        raise HTTPException(
            status_code=404,
            detail="Resume file not found",
        )

    return FileResponse(
        path=candidate.resume_path,
        media_type="application/pdf",
        filename=candidate.resume_filename,
    )


# UPDATE CANDIDATE PROFILE
@router.put(
    "/profile",
    response_model=CandidateProfileResponse,
)
def update_candidate_profile(
    profile: CandidateProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Candidate access required",
        )

    current_user.name = profile.name
    current_user.phone = profile.phone
    current_user.education = profile.education
    current_user.skills = profile.skills
    current_user.experience = profile.experience
    current_user.bio = profile.bio

    db.commit()
    db.refresh(current_user)

    return current_user


# GET CANDIDATE PROFILE FOR RECRUITER
@router.get(
    "/candidate/{candidate_id}/profile",
    response_model=CandidateProfileResponse,
)
def get_candidate_profile_for_recruiter(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    candidate = db.query(User).filter(
        User.id == candidate_id,
        User.role == "candidate",
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    return candidate

# RECRUITER TEST
@router.get("/recruiter-test")
def recruiter_test(
    current_user: User = Depends(require_recruiter),
):
    return {
        "message": "Welcome Recruiter!",
        "user": current_user.name,
    }


# COMPANY PROFILE
@router.get(
    "/company-profile",
    response_model=CompanyProfileResponse,
)
def get_company_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can access company profile",
        )

    profile = db.query(CompanyProfile).filter(
        CompanyProfile.recruiter_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Company profile not found",
        )

    return profile


@router.put(
    "/company-profile",
    response_model=CompanyProfileResponse,
)
def update_company_profile(
    profile_data: CompanyProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can update company profile",
        )

    company_name = profile_data.company_name.strip()

    if not company_name:
        raise HTTPException(
            status_code=400,
            detail="Company name is required",
        )

    profile = db.query(CompanyProfile).filter(
        CompanyProfile.recruiter_id == current_user.id
    ).first()

    if profile:
        profile.company_name = company_name
        profile.industry = profile_data.industry
        profile.company_size = profile_data.company_size
        profile.location = profile_data.location
        profile.website = profile_data.website
        profile.company_email = profile_data.company_email
        profile.company_phone = profile_data.company_phone
        profile.description = profile_data.description

    else:
        profile = CompanyProfile(
            recruiter_id=current_user.id,
            company_name=company_name,
            industry=profile_data.industry,
            company_size=profile_data.company_size,
            location=profile_data.location,
            website=profile_data.website,
            company_email=profile_data.company_email,
            company_phone=profile_data.company_phone,
            description=profile_data.description,
        )

        db.add(profile)

    db.commit()
    db.refresh(profile)

    return profile


@router.post("/company-profile/logo")
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can upload company logo",
        )

    allowed_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    original_filename = file.filename or ""

    extension = os.path.splitext(
        original_filename
    )[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG and WEBP images are allowed",
        )

    file_content = await file.read()

    max_size = 5 * 1024 * 1024

    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Logo size must be less than 5 MB",
        )

    upload_directory = "company_logos"

    os.makedirs(
        upload_directory,
        exist_ok=True,
    )

    profile = db.query(CompanyProfile).filter(
        CompanyProfile.recruiter_id == current_user.id
    ).first()

    if not profile:
        profile = CompanyProfile(
            recruiter_id=current_user.id,
            company_name=current_user.name,
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Delete previous logo
    if (
        profile.logo_path
        and os.path.exists(profile.logo_path)
    ):
        try:
            os.remove(profile.logo_path)
        except OSError:
            pass

    unique_filename = (
        f"{uuid.uuid4().hex}{extension}"
    )

    file_path = os.path.join(
        upload_directory,
        unique_filename,
    )

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    profile.logo_filename = original_filename
    profile.logo_path = file_path

    db.commit()
    db.refresh(profile)

    return {
        "message": "Company logo uploaded successfully",
        "logo_filename": profile.logo_filename,
    }


@router.get("/company-profile/logo")
def get_company_logo(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can access company logo",
        )

    profile = db.query(CompanyProfile).filter(
        CompanyProfile.recruiter_id == current_user.id
    ).first()

    if not profile or not profile.logo_path:
        raise HTTPException(
            status_code=404,
            detail="Company logo not found",
        )

    if not os.path.exists(profile.logo_path):
        raise HTTPException(
            status_code=404,
            detail="Company logo file not found",
        )

    return FileResponse(
        profile.logo_path,
        filename=profile.logo_filename,
    )