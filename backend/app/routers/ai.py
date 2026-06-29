from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func
from app.core.database import get_db
from app.services.ai.ai_service import ai_service
from app.routers.auth import get_current_user
from app.models.models import Habit, DailyLog, Goal, User, Journal
from datetime import date

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/status")
async def check_ai_status(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Checks the status of the AI Uplink and calculates data maturity.
    Used by the AI Control Settings and AI Coach lock system.
    """
    # 1. Calculate Recorded Activity Days
    log_res = await db.execute(
        select(func.count(func.distinct(DailyLog.date)))
        .join(Habit).where(Habit.user_id == user.id)
    )
    recorded_days = log_res.scalar() or 0
    
    # 2. Count Total Journal Entries
    journ_res = await db.execute(
        select(func.count(Journal.id)).where(Journal.user_id == user.id)
    )
    journal_entries = journ_res.scalar() or 0
    
    # 3. Test Groq Connectivity
    conn = await ai_service.verify_connectivity()
    
    return {
        **conn, 
        "recorded_days": recorded_days,
        "journal_entries": journal_entries
    }

@router.get("/briefing")
async def get_ai_briefing(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Dashboard Endpoint: Generates a quick 2-sentence tactical status update.
    """
    # Fetch today's context
    h_res = await db.execute(select(Habit).where(Habit.user_id == user.id, Habit.archived == False))
    habits = h_res.scalars().all()
    
    l_res = await db.execute(
        select(DailyLog).join(Habit)
        .where(Habit.user_id == user.id, DailyLog.date == date.today())
    )
    logs = l_res.scalars().all()
    
    briefing = await ai_service.generate_daily_summary(user.full_name or user.email, habits, logs)
    return {"briefing": briefing}

@router.post("/analyze/{section}")
async def analyze_coach_section(section: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    AI Coach Endpoint: Performs deep dive analysis for specific modules.
    Enforces data maturity locks.
    """
    # 1. Data Maturity Guard
    log_res = await db.execute(
        select(func.count(func.distinct(DailyLog.date)))
        .join(Habit).where(Habit.user_id == user.id)
    )
    recorded_days = log_res.scalar() or 0

    if section == "predictive" and recorded_days < 14:
        raise HTTPException(status_code=400, detail="Tactical Error: Minimum 14 days of data required for forecasting.")
    if section == "weekly" and recorded_days < 7:
        raise HTTPException(status_code=400, detail="Tactical Error: Minimum 7 days of data required for weekly review.")

    # 2. Gather Deep Context
    h_res = await db.execute(select(Habit).where(Habit.user_id == user.id))
    habits = h_res.scalars().all()
    
    g_res = await db.execute(
        select(Goal).where(Goal.user_id == user.id)
        .options(selectinload(Goal.milestones))
    )
    goals = g_res.scalars().all()

    # 3. Build Analysis Packet
    context = {
        "user_name": user.full_name or "User",
        "habits": [{"name": h.name, "category": h.category} for h in habits if not h.archived],
        "goals": [{"title": g.title, "deadline": str(g.deadline)} for g in goals if not g.is_completed],
        "recorded_days": recorded_days
    }
    
    analysis = await ai_service.get_strategic_analysis(section, context)
    return {"analysis": analysis}

@router.get("/quote")
async def get_daily_quote(user: User = Depends(get_current_user)):
    """
    Motivation Hub Endpoint: Generates a human-centric motivational quote.
    """
    quote = await ai_service.generate_pure_quote()
    return {"quote": quote}