from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import User
from pydantic import BaseModel
import bcrypt # Using bcrypt directly to avoid passlib bugs
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = "HABIT_PRO_SECRET_99"
ALGORITHM = "HS256"

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

# Helper functions for direct bcrypt
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed = hash_password(req.password)
    new_user = User(email=req.email, hashed_password=hashed, full_name=req.full_name)
    db.add(new_user)
    await db.commit()
    return {"ok": True}

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Wrong email or password")
    
    expire = datetime.utcnow() + timedelta(days=7)
    token = jwt.encode({"sub": user.email, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}