from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import JournalCreate, JournalOut, JournalStats
from app.routers.auth import get_current_user
from app.services import journal_service # Importing the brain

router = APIRouter(prefix="/journal", tags=["journal"])

@router.get("/", response_model=List[JournalOut])
async def list_journals(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Fetches the full timeline of behavioral records.
    """
    return await journal_service.list_user_journals(db, user.id)

@router.post("/", response_model=JournalOut)
async def create_journal(req: JournalCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Saves a new daily entry and validates integrity.
    """
    new_entry = await journal_service.create_user_journal(db, user.id, req)
    
    if not new_entry:
        raise HTTPException(
            status_code=400, 
            detail="Tactical Alert: Daily entry already secured for this date."
        )
    return new_entry

@router.get("/stats", response_model=JournalStats)
async def get_journal_stats(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Retrieves real-time writing streaks and AI maturity tier status.
    """
    return await journal_service.get_behavioral_stats(db, user.id)

@router.delete("/{id}")
async def delete_journal(id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Permanently purges a record from the behavioral archive.
    """
    success = await journal_service.terminate_journal_record(db, user.id, id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Record not found in vault.")
    
    return {"ok": True, "message": "Evidence terminated."}