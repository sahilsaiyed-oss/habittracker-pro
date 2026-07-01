from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.models.models import Goal, Milestone, Habit, User, goal_habit_association
from app.schemas.schemas import GoalCreate, GoalOut, MilestoneCreate, GoalUpdate
from app.routers.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/goals", tags=["goals"])

@router.get("/", response_model=List[GoalOut])
async def list_user_missions(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Retrieves all strategic missions for the authenticated operative.
    PATCH: Fixed import error and implemented Daily Progress Reset.
    """
    result = await db.execute(
        select(Goal)
        .where(Goal.user_id == user.id)
        .options(
            selectinload(Goal.milestones), 
            selectinload(Goal.linked_habits)
        )
    )
    missions = result.scalars().all()
    
    # Use standard UTC date for comparison
    today = datetime.utcnow().date()
    needs_refresh = False

    for goal in missions:
        # If the last update was before today, reset today's tactical progress
        if goal.updated_at.date() < today:
            for ms in goal.milestones:
                ms.is_completed = False
            
            # Update timestamp to today so it doesn't reset again until tomorrow
            goal.updated_at = datetime.utcnow()
            needs_refresh = True
    
    if needs_refresh:
        await db.commit()
    
    return missions

@router.post("/", response_model=GoalOut)
async def initialize_mission(req: GoalCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Launches a new long-term strategic objective.
    """
    new_goal = Goal(**req.model_dump(), user_id=user.id)
    db.add(new_goal)
    await db.commit()
    
    result = await db.execute(
        select(Goal)
        .where(Goal.id == new_goal.id)
        .options(selectinload(Goal.milestones), selectinload(Goal.linked_habits))
    )
    return result.scalar_one()

@router.post("/{goal_id}/milestones")
async def add_mission_checkpoint(goal_id: int, req: MilestoneCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Adds a tactical milestone to a specific mission.
    """
    g_check = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    if not g_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Mission not found.")
    
    db.add(Milestone(goal_id=goal_id, title=req.title))
    await db.commit()
    return {"ok": True, "message": "Checkpoint registered."}

@router.patch("/milestones/{ms_id}/toggle")
async def toggle_checkpoint_status(ms_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Toggles a milestone status.
    """
    res = await db.execute(select(Milestone).where(Milestone.id == ms_id))
    ms = res.scalar_one_or_none()
    
    if not ms:
        raise HTTPException(status_code=404, detail="Checkpoint not found.")
    
    ms.is_completed = not ms.is_completed
    await db.commit()
    return {"ok": True, "new_status": ms.is_completed}

@router.post("/{goal_id}/link/{habit_id}")
async def toggle_strategic_link(goal_id: int, habit_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Toggles Habit-Mission relationship.
    """
    g_res = await db.execute(
        select(Goal)
        .where(Goal.id == goal_id, Goal.user_id == user.id)
        .options(selectinload(Goal.linked_habits))
    )
    goal = g_res.scalar_one_or_none()
    
    h_res = await db.execute(select(Habit).where(Habit.id == habit_id, Habit.user_id == user.id))
    habit = h_res.scalar_one_or_none()

    if not goal or not habit:
        raise HTTPException(status_code=404, detail="Resource not found.")

    if habit in goal.linked_habits:
        goal.linked_habits.remove(habit)
        status = "unlinked"
    else:
        goal.linked_habits.append(habit)
        status = "linked"
        
    await db.commit()
    return {"ok": True, "status": status}

@router.delete("/{goal_id}")
async def terminate_mission(goal_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Deletes a mission.
    """
    res = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    goal = res.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Mission not found.")
        
    await db.delete(goal)
    await db.commit()
    return {"ok": True, "message": "Mission terminated."}