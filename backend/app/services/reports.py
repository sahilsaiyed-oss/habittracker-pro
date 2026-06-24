from datetime import date, timedelta, datetime
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.models import Habit, DailyLog, Goal, Milestone, Report, goal_habit_association
from fpdf import FPDF

def calculate_grade(score):
    if score >= 95: return "A+"
    if score >= 85: return "A"
    if score >= 75: return "B+"
    if score >= 60: return "B"
    return "C"

async def get_reporting_status(db, user_id):
    today = date.today()
    start_week = today - timedelta(days=today.weekday()) # Monday
    start_month = today.replace(day=1) # 1st of month

    async def count_active_days(start_date):
        res = await db.execute(
            select(func.count(func.distinct(DailyLog.date)))
            .join(Habit).where(Habit.user_id == user_id, DailyLog.date >= start_date, DailyLog.date < today)
        )
        return res.scalar() or 0

    w_count = await count_active_days(start_week)
    m_count = await count_active_days(start_month)

    return {
        "weekly": {"recorded": w_count, "required": 4, "total_days": 7},
        "monthly": {"recorded": m_count, "required": 15, "total_days": 30},
        "current_week_tracker": [(start_week + timedelta(days=i)).isoformat() for i in range(7)]
    }

async def generate_snapshot(db, user_id, type='weekly', period_label=""):
    today = date.today()
    if type == 'weekly':
        end_d = today - timedelta(days=today.weekday() + 1)
        start_d = end_d - timedelta(days=6)
        days = 7
    else:
        first_this_month = today.replace(day=1)
        end_d = first_this_month - timedelta(days=1)
        start_d = end_d.replace(day=1)
        days = (end_d - start_d).days + 1

    h_res = await db.execute(select(Habit).where(Habit.user_id == user_id, Habit.archived == False))
    habits = h_res.scalars().all()
    if not habits: return None

    l_res = await db.execute(select(DailyLog).join(Habit).where(Habit.user_id == user_id, DailyLog.date >= start_d, DailyLog.date <= end_d))
    logs = l_res.scalars().all()

    habit_stats = []
    for h in habits:
        done = sum(1 for l in logs if l.habit_id == h.id and l.status == "done")
        rate = (done / days) * 100
        habit_stats.append({"name": h.name, "done": done, "rate": rate})

    ranked = sorted(habit_stats, key=lambda x: x['rate'], reverse=True)
    best = next((h for h in ranked if h['rate'] >= 50), None)
    weakest = ranked[-1] if ranked else None
    score = round(sum(h['rate'] for h in habit_stats) / len(habit_stats), 1) if habits else 0

    report_data = {
        "score": score,
        "grade": calculate_grade(score),
        "completion_rate": score,
        "best_habit": best["name"] if best else "No Strong Habit Identified",
        "weakest_habit": weakest["name"] if weakest else "N/A",
        "rankings": ranked[:5],
        "period": f"{start_d} to {end_d}"
    }

    new_report = Report(user_id=user_id, type=type, period_label=period_label, data=report_data)
    db.add(new_report)
    await db.commit()
    return report_data

def generate_pdf_report(user_name, report_data):
    pdf = FPDF()
    pdf.add_page()
    
    # B&W Professional Header
    pdf.set_font("Arial", 'B', 24)
    pdf.cell(0, 20, "OFFICIAL PERFORMANCE AUDIT", ln=True, align='L')
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(0, 5, f"HABIT TRACKER PRO | GENERATED: {date.today()}", ln=True)
    pdf.line(10, 40, 200, 40)
    pdf.ln(20)

    # Executive Summary
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, f"EXECUTIVE SUMMARY: {user_name.upper()}", ln=True)
    pdf.set_font("Arial", '', 12)
    pdf.cell(0, 10, f"Audit Period: {report_data.get('period', 'N/A')}", ln=True)
    pdf.cell(0, 10, f"Performance Score: {report_data['score']}%", ln=True)
    pdf.cell(0, 10, f"Audit Grade: {report_data['grade']}", ln=True)
    pdf.ln(10)

    # Analysis
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "HABIT ANALYSIS", ln=True)
    pdf.set_font("Arial", '', 12)
    pdf.cell(0, 10, f"Primary Strength: {report_data['best_habit']}", ln=True)
    pdf.cell(0, 10, f"Critical Weakness: {report_data['weakest_habit']}", ln=True)
    pdf.ln(10)

    # Leaderboard
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(0, 10, "TOP PERFORMERS", ln=True)
    pdf.set_font("Arial", '', 11)
    for h in report_data['rankings']:
        pdf.cell(0, 8, f"- {h['name']}: {round(h['rate'])}% Efficiency", ln=True)

    pdf.set_y(-30)
    pdf.set_font("Arial", 'I', 8)
    pdf.cell(0, 10, "This is an immutable historical record. Authorized by Habit Tracker Pro Reporting Engine.", align='C')
    
    return bytes(pdf.output())