from datetime import date, timedelta
from sqlalchemy import select, func
from app.models.models import Habit, DailyLog

async def get_analytics(db, user_id: int):
    """
    The main intelligence engine for numerical data.
    Calculates weighted scores, habit rankings, and consistency trends.
    """
    # 1. Fetch Active Habits for this user
    h_result = await db.execute(
        select(Habit).where(Habit.user_id == user_id, Habit.archived == False)
    )
    habits = h_result.scalars().all()
    active_count = len(habits)

    # 2. Fetch Logs for the last 7 days (Weekly Window)
    week_ago = date.today() - timedelta(days=6)
    l_result = await db.execute(
        select(DailyLog).join(Habit).where(
            Habit.user_id == user_id, 
            DailyLog.date >= week_ago
        )
    )
    week_logs = l_result.scalars().all()

    # 3. Calculate Weekly Performance & Daily Scores
    weekly_data = []
    total_earned_score = 0
    total_possible_score = 0

    # Loop through the last 7 days including today
    for i in range(6, -1, -1):
        curr_date = date.today() - timedelta(days=i)
        day_logs = [l for l in week_logs if l.date == curr_date and l.status == "done"]
        
        # Formula: (Habits Done today / Total Active Habits) * 100
        score = (len(day_logs) / active_count * 100) if active_count > 0 else 0
        
        weekly_data.append({
            "day": curr_date.strftime("%a"),
            "date": curr_date.isoformat(),
            "score": round(score, 1),
            "completed": len(day_logs)
        })
        
        total_earned_score += len(day_logs)
        total_possible_score += active_count

    # Calculate 7-Day Average Completion Rate
    completion_rate = (total_earned_score / total_possible_score * 100) if total_possible_score > 0 else 0

    # 4. Strategic Leaderboard (Habit Rankings)
    rankings = []
    for h in habits:
        h_logs_res = await db.execute(
            select(func.count(DailyLog.id)).where(
                DailyLog.habit_id == h.id, 
                DailyLog.status == "done"
            )
        )
        done_count = h_logs_res.scalar() or 0
        
        # Check strategic importance (⭐ logic)
        # In a real SaaS, this would check the goal_habit_association table
        rankings.append({
            "name": h.name,
            "count": done_count,
            "rate": round((done_count / 7 * 100), 1) if i < 7 else 0, # Based on current week
            "category": h.category
        })
    
    # Sort habits by most completed first
    rankings = sorted(rankings, key=lambda x: x['count'], reverse=True)

    # 5. 90-Day Consistency Heatmap Logic
    heatmap = []
    start_90 = date.today() - timedelta(days=89)
    # Fetch all logs for the 90-day window
    all_logs_res = await db.execute(
        select(DailyLog).join(Habit).where(
            Habit.user_id == user_id, 
            DailyLog.date >= start_90
        )
    )
    all_logs = all_logs_res.scalars().all()

    for i in range(90):
        target_d = start_90 + timedelta(days=i)
        day_done = sum(1 for l in all_logs if l.date == target_d and l.status == "done")
        
        # Intensity: 0 to 1 based on completion
        intensity = (day_done / active_count) if active_count > 0 else 0
        heatmap.append({
            "date": target_d.isoformat(),
            "intensity": round(intensity, 2)
        })

    return {
        "active_habits": active_count,
        "completion_rate": round(completion_rate, 1),
        "weekly_data": weekly_data,
        "rankings": rankings,
        "heatmap": heatmap,
        "today_score": weekly_data[-1]["score"] # Last item in weekly_data is Today
    }