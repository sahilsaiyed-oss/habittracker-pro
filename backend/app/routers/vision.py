from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import shutil
import os
import uuid
from app.core.database import get_db
from app.models.models import VisionImage, VisionMedia, User
from app.schemas.schemas import VisionImageOut, VisionMediaOut
from app.routers.auth import get_current_user
from typing import List

router = APIRouter(prefix="/vision", tags=["vision"])

# Directory configuration
# Ensure this matches the mount path in main.py
UPLOAD_DIR = "static/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_motivation_asset(
    file: UploadFile = File(...), 
    category: str = Form("Wallpaper"), 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """
    Saves uploaded files to the server and creates a database record.
    Supports Images (Wallpapers), Videos, Music, and PDFs.
    """
    # 1. Generate Unique Filename to prevent overwriting
    ext = file.filename.split(".")[-1].lower()
    unique_filename = f"{user.id}_{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # 2. Save physical file to static/uploads
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")
    
    # 3. Logic: Categorize based on extension
    # Accessible via: http://localhost:8000/static/uploads/filename
    public_url = f"/static/uploads/{unique_filename}"
    
    if ext in ["mp4", "webm", "mov"]:
        # Video Logic
        new_item = VisionMedia(
            user_id=user.id, title=file.filename, source=public_url, 
            type="video", platform="local"
        )
        db.add(new_item)
    elif ext in ["mp3", "wav", "m4a", "aac"]:
        # Audio Logic
        new_item = VisionMedia(
            user_id=user.id, title=file.filename, source=public_url, 
            type="music", platform="local"
        )
        db.add(new_item)
    elif ext == "pdf":
        # PDF Book Logic
        new_item = VisionMedia(
            user_id=user.id, title=file.filename, source=public_url, 
            type="pdf", platform="local"
        )
        db.add(new_item)
    else:
        # Image/Wallpaper Logic
        new_item = VisionImage(
            user_id=user.id, url=public_url, category=category
        )
        db.add(new_item)
        
    await db.commit()
    return {"ok": True, "url": public_url, "type": ext}

@router.get("/images", response_model=List[VisionImageOut])
async def get_wallpapers(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Retrieves all uploaded wallpapers for the current user.
    """
    res = await db.execute(select(VisionImage).where(VisionImage.user_id == user.id))
    return res.scalars().all()

@router.get("/media", response_model=List[VisionMediaOut])
async def get_motivation_media(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Retrieves all uploaded videos, music, and PDFs for the current user.
    """
    res = await db.execute(select(VisionMedia).where(VisionMedia.user_id == user.id))
    return res.scalars().all()

@router.delete("/delete/{type}/{item_id}")
async def delete_vault_asset(
    type: str, 
    item_id: int, 
    db: AsyncSession = Depends(get_db), 
    user: User = Depends(get_current_user)
):
    """
    Permanently deletes a record from the database.
    (Future improvement: Delete physical file as well)
    """
    if type == "image":
        res = await db.execute(
            select(VisionImage).where(VisionImage.id == item_id, VisionImage.user_id == user.id)
        )
    else:
        res = await db.execute(
            select(VisionMedia).where(VisionMedia.id == item_id, VisionMedia.user_id == user.id)
        )
    
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Asset not found in your vault.")
    
    await db.delete(item)
    await db.commit()
    return {"ok": True, "message": "Asset terminated from vault."}