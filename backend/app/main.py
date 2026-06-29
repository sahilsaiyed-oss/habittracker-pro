from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.database import engine, Base
from app.routers import habits, analytics, auth, goals, reports, ai, journal, vision
import os

# Initialize FastAPI App
app = FastAPI(title="Habit Tracker Pro API")

# 1. CORS Configuration
# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Static Files Mounting
# Iske bina Vision Vault ki uploaded images/videos browser mein nahi dikhengi
UPLOAD_DIR = "static/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

# 3. Router Registration
# Saare modules ke darwaze yahan se khul rahe hain
app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(analytics.router)
app.include_router(goals.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(journal.router)
app.include_router(vision.router)

# 4. Database Initialization
# Server start hote hi naye tables apne aap ban jayenge
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# 5. System Health Check
@app.get("/health")
async def health():
    return {
        "status": "operational",
        "message": "Neural Link Active",
        "version": "2.0.0"
    }