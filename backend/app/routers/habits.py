from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.models import Habit, DailyLog
from app.schemas.schemas import HabitCreate, HabitUpdate, HabitOut, DailyLogCreate, DailyLogUpdate, DailyLogOut
from app.services.analytics import get_habit_streaks, calculate_streaks
from datetime import date

router = APIRouter(prefix="/habits", tags=["habits"])

@router.post("/", response_model=HabitOut)
async def create_habit(habit: HabitCreate, db: AsyncSession = Depends(get_db)):
    db_habit = Habit(**habit.model_dump())
    db.add(db_habit)
    await db.commit()
    await db.refresh(db_habit)
    return db_habit

@router.get("/", response_model=List[HabitOut])
async def list_habits(archived: bool = False, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.archived == archived))
    return result.scalars().all()

@router.get("/{habit_id}", response_model=HabitOut)
async def get_habit(habit_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit

@router.patch("/{habit_id}", response_model=HabitOut)
async def update_habit(habit_id: int, habit_update: HabitUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for key, value in habit_update.model_dump(exclude_unset=True).items():
        setattr(habit, key, value)
    await db.commit()
    await db.refresh(habit)
    return habit

@router.delete("/{habit_id}")
async def delete_habit(habit_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await db.delete(habit)
    await db.commit()
    return {"ok": True}

@router.get("/{habit_id}/streaks")
async def habit_streaks(habit_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    streaks = await get_habit_streaks(db, habit_id)
    return streaks

@router.post("/{habit_id}/logs", response_model=DailyLogOut)
async def create_log(habit_id: int, log: DailyLogCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Habit).where(Habit.id == habit_id))
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    existing = await db.execute(
        select(DailyLog).where(DailyLog.habit_id == habit_id, DailyLog.date == log.date)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Log already exists for this date")
    db_log = DailyLog(habit_id=habit_id, date=log.date, status=log.status)
    db.add(db_log)
    await db.commit()
    await db.refresh(db_log)
    return db_log

@router.patch("/{habit_id}/logs/{log_date}", response_model=DailyLogOut)
async def update_log(habit_id: int, log_date: date, log_update: DailyLogUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DailyLog).where(DailyLog.habit_id == habit_id, DailyLog.date == log_date)
    )
    log = result.scalar_one_or_none()
    if not log:
        # create if not exists
        log = DailyLog(habit_id=habit_id, date=log_date, status=log_update.status)
        db.add(log)
    else:
        log.status = log_update.status
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/{habit_id}/logs", response_model=List[DailyLogOut])
async def list_logs(habit_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DailyLog).where(DailyLog.habit_id == habit_id))
    return result.scalars().all()
