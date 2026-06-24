from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, Report
from app.services.reports import get_reporting_status, generate_snapshot, generate_pdf_report
from datetime import date, timedelta

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/status")
async def report_status(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await get_reporting_status(db, user.id)

@router.get("/dashboard")
async def get_reports_dashboard(db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    status = await get_reporting_status(db, user.id)
    result = await db.execute(select(Report).where(Report.user_id == user.id).order_by(Report.created_at.desc()))
    history = result.scalars().all()
    return {"status": status, "history": history}

@router.get("/export/{report_id}")
async def export_report_pdf(report_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    res = await db.execute(select(Report).where(Report.id == report_id, Report.user_id == user.id))
    report = res.scalar_one_or_none()
    if not report: raise HTTPException(status_code=404)
    
    pdf_content = generate_pdf_report(user.full_name or user.email, report.data)
    return Response(content=pdf_content, media_type="application/pdf")