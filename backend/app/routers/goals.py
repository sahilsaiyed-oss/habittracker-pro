from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.models.models import Goal, Milestone, Habit, User, goal_habit_association
from app.schemas.schemas import GoalCreate, GoalOut, MilestoneCreate
from app.routers.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/", response_model=List[GoalOut])
async def list_goals(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Goal).where(Goal.user_id == user.id)
        .options(selectinload(Goal.milestones), selectinload(Goal.linked_habits))
    )
    return result.scalars().all()

@router.post("/", response_model=GoalOut)
async def create_goal(req: GoalCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    new_goal = Goal(**req.model_dump(), user_id=user.id)
    db.add(new_goal)
    await db.commit()
    result = await db.execute(
        select(Goal).where(Goal.id == new_goal.id)
        .options(selectinload(Goal.milestones), selectinload(Goal.linked_habits))
    )
    return result.scalar_one()

@router.post("/{goal_id}/milestones")
async def add_milestone(goal_id: int, req: MilestoneCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    g = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    if not g.scalar_one_or_none(): raise HTTPException(status_code=404)
    db.add(Milestone(goal_id=goal_id, title=req.title))
    await db.commit()
    return {"ok": True}

# --- NEW: DELETE MILESTONE ---
@router.delete("/milestones/{ms_id}")
async def delete_milestone(ms_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Milestone).where(Milestone.id == ms_id))
    ms = res.scalar_one_or_none()
    if not ms: raise HTTPException(status_code=404)
    await db.delete(ms)
    await db.commit()
    return {"ok": True}

@router.patch("/milestones/{ms_id}/toggle")
async def toggle_milestone(ms_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Milestone).where(Milestone.id == ms_id))
    ms = res.scalar_one_or_none()
    if not ms: raise HTTPException(status_code=404)
    ms.is_completed = not ms.is_completed
    await db.commit()
    return {"ok": True}

@router.post("/{goal_id}/link/{habit_id}")
async def toggle_habit_link(goal_id: int, habit_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    g_res = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id).options(selectinload(Goal.linked_habits)))
    goal = g_res.scalar_one_or_none()
    if not goal: raise HTTPException(status_code=404)
    h_res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    habit = h_res.scalar_one_or_none()
    if not habit: raise HTTPException(status_code=404)
    
    if habit in goal.linked_habits:
        goal.linked_habits.remove(habit)
        status = "unlinked"
    else:
        goal.linked_habits.append(habit)
        status = "linked"
    await db.commit()
    return {"status": status}

@router.delete("/{goal_id}")
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    goal = res.scalar_one_or_none()
    if not goal: raise HTTPException(status_code=404)
    await db.delete(goal)
    await db.commit()
    return {"ok": True}