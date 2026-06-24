from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.analytics import get_analytics
from app.routers.auth import get_current_user # Add this
from app.models.models import User # Add this

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/")
async def analytics(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    # Pass user.id to the service
    return await get_analytics(db, user_id=user.id)