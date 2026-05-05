from datetime import date, timedelta
from typing import List, Dict
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Habit, DailyLog

STATUS_DONE = "done"
STATUS_MISSED = "missed"
STATUS_SKIP = "skip"

def calculate_streaks(logs: List[DailyLog]) -> Dict[str, int]:
    done_dates = sorted(
        [log.date for log in logs if log.status == STATUS_DONE],
        reverse=True
    )
    if not done_dates:
        return {"current_streak": 0, "best_streak": 0}

    current_streak = 0
    check_date = date.today()
    # If no log for today, check if yesterday has a done to continue streak
    if check_date not in done_dates:
        if check_date - timedelta(days=1) in done_dates:
            check_date = check_date - timedelta(days=1)
        else:
            # current streak is 0 unless today is done
            pass

    if check_date in done_dates:
        current_streak = 1
        d = check_date - timedelta(days=1)
        while d in done_dates:
            current_streak += 1
            d -= timedelta(days=1)

    # Best streak
    best_streak = 0
    temp = 0
    all_dates = sorted([log.date for log in logs if log.status == STATUS_DONE])
    if not all_dates:
        return {"current_streak": current_streak, "best_streak": 0}

    prev = None
    for d in all_dates:
        if prev is None:
            temp = 1
        elif d == prev + timedelta(days=1):
            temp += 1
        else:
            best_streak = max(best_streak, temp)
            temp = 1
        prev = d
    best_streak = max(best_streak, temp)

    return {"current_streak": current_streak, "best_streak": best_streak}

async def get_habit_streaks(db: AsyncSession, habit_id: int):
    result = await db.execute(select(DailyLog).where(DailyLog.habit_id == habit_id))
    logs = result.scalars().all()
    return calculate_streaks(logs)

async def get_analytics(db: AsyncSession):
    total_result = await db.execute(select(func.count(Habit.id)).where(Habit.archived == False))
    total_habits = total_result.scalar() or 0

    active_result = await db.execute(
        select(func.count(Habit.id)).where(
            and_(Habit.archived == False, Habit.created_at <= date.today())
        )
    )
    active_habits = active_result.scalar() or 0

    # Completion rate for last 7 days
    week_ago = date.today() - timedelta(days=6)
    logs_result = await db.execute(
        select(DailyLog).where(DailyLog.date >= week_ago)
    )
    week_logs = logs_result.scalars().all()
    done_count = sum(1 for log in week_logs if log.status == STATUS_DONE)
    total_count = len(week_logs)
    completion_rate = (done_count / total_count * 100) if total_count > 0 else 0.0

    # Weekly data (last 7 days)
    weekly_data = []
    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        day_logs_result = await db.execute(select(DailyLog).where(DailyLog.date == d))
        day_logs = day_logs_result.scalars().all()
        day_done = sum(1 for log in day_logs if log.status == STATUS_DONE)
        day_total = len(day_logs)
        weekly_data.append({
            "date": d.isoformat(),
            "day": d.strftime("%a"),
            "done": day_done,
            "total": day_total,
            "rate": (day_done / day_total * 100) if day_total > 0 else 0.0
        })

    # Heatmap for last 90 days
    heatmap = []
    start = date.today() - timedelta(days=89)
    for i in range(90):
        d = start + timedelta(days=i)
        day_logs_result = await db.execute(select(DailyLog).where(DailyLog.date == d))
        day_logs = day_logs_result.scalars().all()
        day_done = sum(1 for log in day_logs if log.status == STATUS_DONE)
        day_total = len(day_logs)
        heatmap.append({
            "date": d.isoformat(),
            "intensity": (day_done / day_total) if day_total > 0 else -1
        })

    return {
        "total_habits": total_habits,
        "active_habits": active_habits,
        "completion_rate": round(completion_rate, 1),
        "weekly_data": weekly_data,
        "heatmap": heatmap
    }
