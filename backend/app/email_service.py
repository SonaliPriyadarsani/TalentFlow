import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# EMAIL CONFIGURATION
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


# BASIC EMAIL SENDER
def send_email(
    recipient_email: str,
    subject: str,
    body: str
):
    """
    Sends an email.

    Returns:
        True  -> email sent
        False -> email failed
    """

    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("Email configuration is missing.")
        return False

    try:

        message = MIMEMultipart()

        message["From"] = f"TalentFlow Team <{EMAIL_ADDRESS}>"
        message["To"] = recipient_email
        message["Subject"] = subject

        message.attach(
            MIMEText(body, "plain")
        )

        with smtplib.SMTP(
            SMTP_SERVER,
            SMTP_PORT
        ) as server:

            server.starttls()

            server.login(
                EMAIL_ADDRESS,
                EMAIL_PASSWORD
            )

            server.sendmail(
                EMAIL_ADDRESS,
                recipient_email,
                message.as_string()
            )

        print(
            f"Email sent successfully to {recipient_email}"
        )

        return True

    except Exception as error:

        print(
            f"Failed to send email to {recipient_email}: {error}"
        )

        return False


# REGISTRATION EMAIL

def send_registration_email(
    name: str,
    email: str,
    role: str
):

    subject = "Welcome to TalentFlow"

    role_name = (
        "Candidate"
        if role == "candidate"
        else "Recruiter"
    )

    body = f"""
Hello {name},

Welcome to TalentFlow!

Your {role_name} account has been created successfully.

Registered Email: {email}
Account Type: {role_name}

You can now log in to TalentFlow and start using your account.

Regards,
TalentFlow Team
"""

    return send_email(
        email,
        subject,
        body
    )


# LOGIN EMAIL
def send_login_email(
    name: str,
    email: str,
    role: str
):

    subject = "New Login to Your TalentFlow Account"

    role_name = (
        "Candidate"
        if role == "candidate"
        else "Recruiter"
    )

    body = f"""
Hello {name},

A new login to your TalentFlow account was detected.

Account: {role_name}
Email: {email}

If this login was made by you, no action is required.

If you do not recognize this login, please review your account security.

Regards,
TalentFlow Team
"""

    return send_email(
        email,
        subject,
        body
    )


# NEW APPLICATION EMAIL TO RECRUITER
def send_new_application_email(
    recruiter_email: str,
    recruiter_name: str,
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    company_name: str
):

    subject = f"New Application Received - {job_title}"

    body = f"""
Hello {recruiter_name},

You have received a new job application on TalentFlow.

Job: {job_title}
Company: {company_name}

Candidate Name: {candidate_name}
Candidate Email: {candidate_email}

Please log in to TalentFlow to review the candidate's application and profile.

Regards,
TalentFlow Team
"""

    return send_email(
        recruiter_email,
        subject,
        body
    )


# GENERAL APPLICATION STATUS EMAIL
def send_status_change_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str,
    new_status: str
):

    subject = f"Application Status Update - {job_title}"

    body = f"""
Hello {candidate_name},

Your application for the position of {job_title}
at {company_name} has been updated.

New Application Status: {new_status}

Please log in to TalentFlow to view your application details.

Regards,
TalentFlow Team
"""

    return send_email(
        candidate_email,
        subject,
        body
    )


# SELECTED / CONGRATULATIONS EMAIL
def send_selection_email(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str
):

    subject = f"Congratulations! You Have Been Selected - {job_title}"

    body = f"""
Hello {candidate_name},

Congratulations!

We are pleased to inform you that you have been selected
for the position of {job_title} at {company_name}.

Application Status: SELECTED

Please log in to TalentFlow to view your application details
and any further information from the recruiter.

Congratulations once again!

Regards,
TalentFlow Team
"""

    return send_email(
        candidate_email,
        subject,
        body
    )


# NEW NOTIFICATION EMAIL
def send_new_notification_email(
    candidate_email: str,
    candidate_name: str,
    notification_message: str
):

    subject = "You Have a New Notification on TalentFlow"

    body = f"""
Hello {candidate_name},

You have a new notification in your TalentFlow profile.

Notification:
{notification_message}

Please log in to TalentFlow to view your notification details.

Regards,
TalentFlow Team
"""

    return send_email(
        candidate_email,
        subject,
        body
    )


# JOB DEADLINE FINISHED EMAIL
def send_job_deadline_email(
    recruiter_email: str,
    recruiter_name: str,
    job_title: str,
    company_name: str,
    closing_date
):

    subject = f"Application Deadline Finished - {job_title}"

    body = f"""
Hello {recruiter_name},

The application deadline for the following job has finished.

Job: {job_title}
Company: {company_name}
Application Deadline: {closing_date}

New candidates can no longer apply for this job.

You can still review existing applications and update their
application statuses from your TalentFlow recruiter dashboard.

Regards,
TalentFlow Team
"""

    return send_email(
        recruiter_email,
        subject,
        body
    )

# FORGOT PASSWORD EMAIL
def send_password_reset_email(
    name: str,
    email: str,
    reset_link: str
):

    subject = "Reset Your TalentFlow Password"

    body = f"""
Hello {name},

We received a request to reset the password for your TalentFlow account.
Click the link below to create a new password:

{reset_link}

This password reset link will expire in 30 minutes.
If you did not request a password reset, you can safely ignore this email.

For your security, the reset link can no longer be used after your password has been changed.

Regards,
TalentFlow Team
"""

    return send_email(
        email,
        subject,
        body
    )