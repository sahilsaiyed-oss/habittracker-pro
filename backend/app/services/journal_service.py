from datetime import date, timedelta
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Journal
from app.schemas.schemas import JournalCreate

async def list_user_journals(db: AsyncSession, user_id: int):
    """
    Retrieves all journal entries for a specific operative, 
    sorted by the most recent date.
    """
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id)
        .order_by(desc(Journal.date))
    )
    return result.scalars().all()

async def create_user_journal(db: AsyncSession, user_id: int, req: JournalCreate):
    """
    Secures a new behavioral record. 
    Enforces a strict one-entry-per-day integrity protocol.
    """
    # Check for existing entry today
    check = await db.execute(
        select(Journal).where(Journal.user_id == user_id, Journal.date == req.date)
    )
    if check.scalar_one_or_none():
        return None # Controller will handle the 400 error
    
    new_journal = Journal(**req.model_dump(), user_id=user_id)
    db.add(new_journal)
    await db.commit()
    await db.refresh(new_journal)
    return new_journal

async def get_behavioral_stats(db: AsyncSession, user_id: int):
    """
    Calculates operational stats: Writing Streaks and AI Maturity Tiers.
    This serves as the 'Behavioral Memory' status report.
    """
    # Fetch all entry dates to calculate streak
    result = await db.execute(
        select(Journal.date)
        .where(Journal.user_id == user_id)
        .order_by(desc(Journal.date))
    )
    dates = [r[0] for r in result.all()]
    
    # 1. Writing Streak Logic
    streak = 0
    if dates:
        curr = date.today()
        # Streak stays alive if last entry was today or yesterday
        if dates[0] == curr or dates[0] == curr - timedelta(days=1):
            for i in range(len(dates)):
                if i == 0 and dates[i] < curr - timedelta(days=1): break
                if i > 0 and dates[i] != dates[i-1] - timedelta(days=1): break
                streak += 1

    # 2. AI Maturity Logic (The "Unlock" Protocol)
    count = len(dates)
    if count >= 30:
        status = "Deep Intelligence Active"
    elif count >= 14:
        status = "Neural Patterns Identified"
    elif count >= 7:
        status = "Weekly Context Ready"
    elif count >= 3:
        status = "Indexing Behavior"
    else:
        status = "Collecting Evidence"

    return {
        "total_entries": count,
        "current_streak": streak,
        "ai_status": status,
        "maturity_percentage": min(100, (count / 30) * 100)
    }

async def terminate_journal_record(db: AsyncSession, user_id: int, journal_id: int):
    """
    Permanently removes behavioral evidence from the system.
    """
    res = await db.execute(
        select(Journal).where(Journal.id == journal_id, Journal.user_id == user_id)
    )
    item = res.scalar_one_or_none()
    if item:
        await db.delete(item)
        await db.commit()
        return True
    return False