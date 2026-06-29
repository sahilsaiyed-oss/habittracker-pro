from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, Report, RecoveryDay
from app.services.reports import get_reporting_status, generate_snapshot, generate_pdf_report
from datetime import date, timedelta

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/status")
async def get_audit_readiness(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Checks if the user has enough data to unlock Weekly or Monthly audits.
    """
    return await get_reporting_status(db, user.id)

@router.get("/dashboard")
async def get_reports_dashboard(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Main portal for the Audit Vault. Returns readiness status and historical archive.
    """
    # 1. Get live readiness status
    status = await get_reporting_status(db, user.id)
    
    # 2. Fetch all historical frozen snapshots for this user
    result = await db.execute(
        select(Report)
        .where(Report.user_id == user.id)
        .order_by(Report.created_at.desc())
    )
    history = result.scalars().all()
    
    return {
        "status": status,
        "history": history
    }

@router.post("/recovery")
async def initiate_recovery_protocol(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Registers a Recovery Day for the current date to protect streaks and audit scores.
    """
    today = date.today()
    
    # Integrity Check: No duplicate recovery days for the same date
    check = await db.execute(
        select(RecoveryDay).where(RecoveryDay.user_id == user.id, RecoveryDay.date == today)
    )
    if check.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Protocol Error: Recovery already active for today.")
    
    db.add(RecoveryDay(user_id=user.id, date=today))
    await db.commit()
    return {"ok": True, "message": "Recovery Protocol Initialized."}

@router.get("/export/{report_id}")
async def export_audit_pdf(report_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Generates a professional PDF performance audit from a frozen database snapshot.
    """
    # 1. Fetch the frozen record
    res = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = res.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Audit Record not found in vault.")
    
    # 2. Pass the frozen JSON data to the PDF service
    # This ensures the PDF reflects the data exactly as it was when the period closed.
    pdf_content = generate_pdf_report(user.full_name or user.email, report.data)
    
    return Response(
        content=pdf_content, 
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=Performance_Audit_{report.period_label}.pdf"
        }
    )

@router.post("/generate-manual/{type}")
async def manual_snapshot_trigger(type: str, period_label: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    (Admin/Dev Tool) Manually trigger a snapshot for testing.
    """
    return await generate_snapshot(db, user.id, type=type, period_label=period_label)