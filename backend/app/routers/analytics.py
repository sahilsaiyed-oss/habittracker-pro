from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.analytics import get_analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
async def analytics(db: AsyncSession = Depends(get_db)):
    return await get_analytics(db)
