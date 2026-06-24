from datetime import date, timedelta
from typing import List, Dict
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Habit, DailyLog

async def get_analytics(db: AsyncSession, user_id: int):
    # 1. Fetch Habits & Logs
    h_result = await db.execute(select(Habit).where(Habit.user_id == user_id, Habit.archived == False))
    habits = h_result.scalars().all()
    active_count = len(habits)

    week_ago = date.today() - timedelta(days=6)
    l_result = await db.execute(
        select(DailyLog).join(Habit).where(Habit.user_id == user_id, DailyLog.date >= week_ago)
    )
    week_logs = l_result.scalars().all()

    # 2. Calculate Weekly Data & Daily Score
    weekly_data = []
    total_possible_score = 0
    total_earned_score = 0

    for i in range(6, -1, -1):
        d = date.today() - timedelta(days=i)
        day_logs = [l for l in week_logs if l.date == d and l.status == "done"]
        
        # Score calculation: Done habits / Total active habits
        score = (len(day_logs) / active_count * 100) if active_count > 0 else 0
        
        weekly_data.append({
            "day": d.strftime("%a"),
            "date": d.isoformat(),
            "score": round(score, 1),
            "completed": len(day_logs)
        })
        
        total_earned_score += len(day_logs)
        total_possible_score += active_count

    completion_rate = (total_earned_score / total_possible_score * 100) if total_possible_score > 0 else 0

    # 3. Habit Rankings (Leaderboard)
    rankings = []
    for h in habits:
        h_logs_res = await db.execute(select(func.count(DailyLog.id)).where(DailyLog.habit_id == h.id, DailyLog.status == "done"))
        done_count = h_logs_res.scalar() or 0
        rankings.append({
            "name": h.name,
            "count": done_count,
            "category": h.category
        })
    rankings = sorted(rankings, key=lambda x: x['count'], reverse=True)

    # 4. Heatmap (90 Days)
    heatmap = []
    start = date.today() - timedelta(days=89)
    all_logs_res = await db.execute(select(DailyLog).join(Habit).where(Habit.user_id == user_id, DailyLog.date >= start))
    all_logs = all_logs_res.scalars().all()

    for i in range(90):
        curr_d = start + timedelta(days=i)
        day_done = sum(1 for l in all_logs if l.date == curr_d and l.status == "done")
        intensity = (day_done / active_count) if active_count > 0 else 0
        heatmap.append({"date": curr_d.isoformat(), "intensity": intensity})

    return {
        "active_habits": active_count,
        "completion_rate": round(completion_rate, 1),
        "weekly_data": weekly_data,
        "rankings": rankings,
        "heatmap": heatmap,
        "today_score": weekly_data[-1]["score"]
    }