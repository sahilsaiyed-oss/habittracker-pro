from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

    # Relationship to habits
    habits = relationship("Habit", back_populates="owner")

class Habit(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    color = Column(String, default="emerald")
    archived = Column(Boolean, default=False)
    created_at = Column(Date, nullable=False)
    
    # Link habit to User (Nullable=True keeps existing data safe)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    logs = relationship("DailyLog", back_populates="habit", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="habits")

class DailyLog(Base):
    __tablename__ = "daily_logs"
    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="-")  # 'done', 'missed', 'skip'

    habit = relationship("Habit", back_populates="logs")

    __table_args__ = (UniqueConstraint("habit_id", "date", name="uix_habit_date"),)