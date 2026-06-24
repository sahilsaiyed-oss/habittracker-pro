from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.models import Habit, DailyLog, User, goal_habit_association, Goal
from app.schemas.schemas import HabitCreate, HabitUpdate, HabitOut, DailyLogCreate, DailyLogUpdate, DailyLogOut
from app.routers.auth import get_current_user
from datetime import date

router = APIRouter(prefix="/habits", tags=["habits"])

@router.get("/", response_model=List[HabitOut])
async def list_habits(archived: bool = False, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Habit).where(Habit.archived == archived, Habit.user_id == user.id))
    habits = result.scalars().all()
    
    # Check strategic status for each habit
    final_habits = []
    for h in habits:
        link_check = await db.execute(
            select(Goal.title).join(goal_habit_association).where(goal_habit_association.c.habit_id == h.id)
        )
        goal_title = link_check.scalar_one_or_none()
        
        h_data = HabitOut.from_orm(h)
        h_data.is_strategic = True if goal_title else False
        h_data.linked_goal_title = goal_title
        final_habits.append(h_data)
        
    return final_habits

@router.post("/", response_model=HabitOut)
async def create_habit(habit: HabitCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    db_habit = Habit(**habit.model_dump(), user_id=user.id)
    db.add(db_habit)
    await db.commit()
    await db.refresh(db_habit)
    return db_habit

@router.patch("/{habit_id}", response_model=HabitOut)
async def update_habit(habit_id: int, habit_update: HabitUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    habit = result.scalar_one_or_none()
    if not habit: raise HTTPException(status_code=404)
    for key, value in habit_update.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)
    await db.commit()
    await db.refresh(habit)
    return habit

@router.patch("/{habit_id}/logs/{log_date}", response_model=DailyLogOut)
async def update_log(habit_id: int, log_date: date, log_update: DailyLogUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    h_res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not h_res.scalar_one_or_none(): raise HTTPException(status_code=404)
    result = await db.execute(select(DailyLog).where(DailyLog.habit_id == habit_id, DailyLog.date == log_date))
    log = result.scalar_one_or_none()
    if not log:
        log = DailyLog(habit_id=habit_id, date=log_date, status=log_update.status)
        db.add(log)
    else: log.status = log_update.status
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/{habit_id}/logs", response_model=List[DailyLogOut])
async def list_logs(habit_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    h_res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    if not h_res.scalar_one_or_none(): raise HTTPException(status_code=404)
    result = await db.execute(select(DailyLog).where(DailyLog.habit_id == habit_id))
    return result.scalars().all()

@router.delete("/{habit_id}")
async def delete_habit(habit_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    habit = result.scalar_one_or_none()
    if not habit: raise HTTPException(status_code=404)
    await db.delete(habit)
    await db.commit()
    return {"ok": True}