from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Table, DateTime, UniqueConstraint, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

# Association Table for Linked Habits
goal_habit_association = Table(
    "goal_habit_association",
    Base.metadata,
    Column("goal_id", Integer, ForeignKey("goals.id", ondelete="CASCADE")),
    Column("habit_id", Integer, ForeignKey("habits.id", ondelete="CASCADE")),
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)

    habits = relationship("Habit", back_populates="owner", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="owner", cascade="all, delete-orphan")
    journals = relationship("Journal", back_populates="owner", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="owner", cascade="all, delete-orphan")

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    color = Column(String, default="emerald")
    archived = Column(Boolean, default=False)
    created_at = Column(Date, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String, default="General")
    difficulty = Column(Integer, default=1)
    importance = Column(Integer, default=1)
    
    owner = relationship("User", back_populates="habits")
    logs = relationship("DailyLog", back_populates="habit", cascade="all, delete-orphan")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, default="General")
    deadline = Column(Date, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_completed = Column(Boolean, default=False)

    owner = relationship("User", back_populates="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan")
    linked_habits = relationship("Habit", secondary=goal_habit_association)

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"))
    title = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    goal = relationship("Goal", back_populates="milestones")

class DailyLog(Base):
    __tablename__ = "daily_logs"
    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="-")

    habit = relationship("Habit", back_populates="logs")
    __table_args__ = (UniqueConstraint("habit_id", "date", name="uix_habit_date"),)

class Journal(Base):
    __tablename__ = "journals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    title = Column(String, nullable=False)
    mood = Column(String, nullable=False)
    reflection = Column(String, nullable=False)
    wins = Column(String, nullable=True)
    challenges = Column(String, nullable=True)
    lessons = Column(String, nullable=True)
    tomorrow_plan = Column(String, nullable=True)
    gratitude = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="journals")

class RecoveryDay(Base):
    __tablename__ = "recovery_days"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    date = Column(Date, unique=True, nullable=False)

class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String) 
    period_label = Column(String) 
    data = Column(JSON) 
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="reports")
    __table_args__ = (UniqueConstraint("user_id", "type", "period_label", name="uix_report_period"),)

class VisionImage(Base):
    __tablename__ = "vision_images"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    url = Column(String, nullable=False) # Local path or URL
    is_primary = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)
    category = Column(String, default="General") # Dream House, Car, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User")

class VisionMedia(Base):
    __tablename__ = "vision_media"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String) # 'music' or 'video'
    title = Column(String, nullable=False)
    source = Column(String, nullable=False) # URL or local path
    platform = Column(String) # 'youtube', 'spotify', 'local'
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User")

class AIMotivationCache(Base):
    __tablename__ = "ai_motivation_cache"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)
    content = Column(String, nullable=False)
    type = Column(String) # 'motivation' or 'quote'