"""Careers / Job Application router."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from database import db, UPLOAD_DIR, get_current_admin, SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, SMTP_PORT
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import uuid
import base64
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/api")

LOCATION_EMAILS = {
    "Fin & Feathers - Stone Mountain": "stonemountain@finandfeathersrestaurants.com",
    "Fin & Feathers - Midtown (Atlanta)": "midtown@finandfeathersrestaurants.com",
    "Fin & Feathers - Edgewood (Atlanta)": "edgewood@finandfeathersrestaurants.com",
    "Fin & Feathers - Douglasville": "douglasville@finandfeathersrestaurants.com",
    "Fin & Feathers - Valdosta": "valdosta@finandfeathersrestaurants.com",
    "Fin & Feathers - Albany": "albany@finandfeathersrestaurants.com",
    "Fin & Feathers - Riverdale": "riverdale@finandfeathersrestaurants.com",
    "Fin & Feathers - Las Vegas": "lasvegas@finandfeathersrestaurants.com",
}


def send_application_email(application_data: dict, recipient_emails: list):
    """Send email notification for new job application"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"New Job Application: {application_data.get('position', 'Unknown')} - {application_data.get('name', 'Unknown')}"
        msg["From"] = SMTP_USERNAME
        msg["To"] = ", ".join(recipient_emails)

        name = application_data.get("name", "N/A")
        email = application_data.get("email", "N/A")
        phone = application_data.get("phone", "N/A")
        position = application_data.get("position", "N/A")
        location = application_data.get("location", "N/A")

        html_content = f"""
        <html><body style="font-family: Arial, sans-serif;">
        <h2>New Job Application Received</h2>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px;">{name}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px;">{email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px;">{phone}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Position:</strong></td><td style="padding: 8px;">{position}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px;">{location}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #888;">View and manage applications at your admin dashboard.</p>
        </body></html>
        """
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, recipient_emails, msg.as_string())
        logging.info(f"Application email sent for {name}")
    except Exception as e:
        logging.error(f"Failed to send application email: {e}")


@router.post("/careers/apply")
async def submit_job_application(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    instagram: str = Form(""),
    facebook: str = Form(""),
    tiktok: str = Form(""),
    location: str = Form(...),
    position_category: str = Form(...),
    position: str = Form(...),
    availability: str = Form("{}"),
    resume: Optional[UploadFile] = File(None),
    headshot: Optional[UploadFile] = File(None),
):
    import json as json_lib

    resume_url = None
    if resume and resume.filename:
        resume_contents = await resume.read()
        if len(resume_contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Resume file too large (max 10MB)")
        resume_id = str(uuid.uuid4())
        resume_ext = Path(resume.filename).suffix.lower()
        resume_filename = f"resume_{resume_id}{resume_ext}"
        resume_b64 = base64.b64encode(resume_contents).decode('utf-8')
        await db.media_files.insert_one({
            "file_id": resume_id, "filename": resume_filename,
            "data": resume_b64, "content_type": resume.content_type or "application/pdf",
            "size": len(resume_contents), "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": "careers_applicant"
        })
        try:
            with open(UPLOAD_DIR / resume_filename, "wb") as f:
                f.write(resume_contents)
        except Exception:
            pass
        resume_url = f"/api/media/{resume_id}"

    headshot_url = None
    if headshot and headshot.filename:
        headshot_contents = await headshot.read()
        if len(headshot_contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Headshot file too large (max 10MB)")
        headshot_id = str(uuid.uuid4())
        headshot_ext = Path(headshot.filename).suffix.lower()
        headshot_filename = f"headshot_{headshot_id}{headshot_ext}"
        headshot_b64 = base64.b64encode(headshot_contents).decode('utf-8')
        await db.media_files.insert_one({
            "file_id": headshot_id, "filename": headshot_filename,
            "data": headshot_b64, "content_type": headshot.content_type or "image/jpeg",
            "size": len(headshot_contents), "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": "careers_applicant"
        })
        try:
            with open(UPLOAD_DIR / headshot_filename, "wb") as f:
                f.write(headshot_contents)
        except Exception:
            pass
        headshot_url = f"/api/media/{headshot_id}"

    try:
        availability_data = json_lib.loads(availability)
    except Exception:
        availability_data = {}

    application_id = str(uuid.uuid4())
    application = {
        "id": application_id, "name": name, "email": email, "phone": phone,
        "social_links": {"instagram": instagram, "facebook": facebook, "tiktok": tiktok},
        "location": location, "location_email": LOCATION_EMAILS.get(location, ""),
        "position_category": position_category, "position": position,
        "availability": availability_data, "resume_url": resume_url,
        "headshot_url": headshot_url, "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.job_applications.insert_one(application)
    logging.info(f"New job application from {name} for {position} at {location}")

    if SMTP_HOST and SMTP_USERNAME:
        recipient_emails = ["info@finandfeathersrestaurants.com", "careers@finandfeathersrestaurants.com", "careers@finandfeathers.live"]
        location_email = LOCATION_EMAILS.get(location, "")
        if location_email:
            recipient_emails.append(location_email)
        send_application_email(application, recipient_emails)

    return {"id": application_id, "message": "Application submitted successfully", "status": "received"}


@router.get("/admin/careers/applications")
async def get_job_applications(username: str = Depends(get_current_admin)):
    return await db.job_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.patch("/admin/careers/applications/{application_id}")
async def update_application_status(application_id: str, body: dict, username: str = Depends(get_current_admin)):
    status = body.get("status")
    if status not in ["new", "reviewed", "interviewed", "hired", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.job_applications.update_one(
        {"id": application_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Status updated", "status": status}


@router.delete("/admin/careers/applications/{application_id}")
async def delete_application(application_id: str, username: str = Depends(get_current_admin)):
    result = await db.job_applications.delete_one({"id": application_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}
