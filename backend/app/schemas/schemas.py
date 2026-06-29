from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

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
    is_strategic: bool = False
    linked_goal_title: Optional[str] = None
    class Config: from_attributes = True

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

class AnalyticsOut(BaseModel):
    active_habits: int
    completion_rate: float
    weekly_data: List[dict]
    rankings: List[dict]
    heatmap: List[dict]
    today_score: float

class JournalCreate(BaseModel):
    date: date
    title: str
    mood: str
    reflection: str
    wins: Optional[str] = None
    challenges: Optional[str] = None
    lessons: Optional[str] = None
    tomorrow_plan: Optional[str] = None
    gratitude: Optional[str] = None

class JournalOut(BaseModel):
    id: int
    date: date
    title: str
    mood: str
    reflection: str
    wins: Optional[str]
    challenges: Optional[str]
    lessons: Optional[str]
    tomorrow_plan: Optional[str]
    gratitude: Optional[str]
    created_at: datetime
    class Config: from_attributes = True

class JournalStats(BaseModel):
    total_entries: int
    current_streak: int
    ai_status: str
    maturity_percentage: float

class VisionImageOut(BaseModel):
    id: int
    url: str
    is_primary: bool
    is_favorite: bool
    category: str
    class Config: from_attributes = True

class VisionMediaOut(BaseModel):
    id: int
    type: str
    title: str
    source: str
    platform: str
    is_favorite: bool
    class Config: from_attributes = True

class AIMotivationOut(BaseModel):
    content: str
    date: date