from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

# --- HABIT SCHEMAS ---
class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "emerald"
    category: str = "General"
    difficulty: int = 1
    importance: int = 1
    created_at: date

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[int] = None
    importance: Optional[int] = None
    archived: Optional[bool] = None

class HabitOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    archived: bool
    category: str
    difficulty: int
    importance: int
    created_at: date
    # NEW: Strategic Indicators
    is_strategic: bool = False
    linked_goal_title: Optional[str] = None

    class Config:
        from_attributes = True

# --- DAILY LOG SCHEMAS ---
class DailyLogCreate(BaseModel):
    habit_id: int
    date: date
    status: str

class DailyLogUpdate(BaseModel):
    status: str

class DailyLogOut(BaseModel):
    id: int
    habit_id: int
    date: date
    status: str
    class Config: from_attributes = True

# --- GOAL SCHEMAS ---
class MilestoneOut(BaseModel):
    id: int
    title: str
    is_completed: bool
    class Config: from_attributes = True

class MilestoneCreate(BaseModel):
    title: str

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "General"
    deadline: date

class GoalUpdate(BaseModel):
    is_completed: Optional[bool] = None

class GoalOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    deadline: date
    is_completed: bool
    updated_at: datetime
    milestones: List[MilestoneOut] = []
    linked_habits: List[HabitOut] = []
    class Config: from_attributes = True

# --- ANALYTICS SCHEMAS ---
class AnalyticsOut(BaseModel):
    active_habits: int
    completion_rate: float
    weekly_data: List[dict]
    rankings: List[dict]
    heatmap: List[dict]
    today_score: float

# --- JOURNAL SCHEMAS ---
class JournalCreate(BaseModel):
    content: str
    mood_score: int = 3
    date: date

class JournalOut(BaseModel):
    id: int
    content: str
    mood_score: int
    date: date
    class Config: from_attributes = True

class WeeklyReviewOut(BaseModel):
    id: int
    start_date: date
    end_date: date
    data: dict
    class Config: from_attributes = True

class MonthlyReportOut(BaseModel):
    id: int
    month: int
    year: int
    data: dict
    class Config: from_attributes = True

class RecoveryDayCreate(BaseModel):
    date: date