from pydantic import BaseModel
from datetime import date
from typing import Optional, List

class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "emerald"
    created_at: date

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    archived: Optional[bool] = None

class HabitOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    archived: bool
    created_at: date

    class Config:
        from_attributes = True

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

    class Config:
        from_attributes = True

class HabitWithLogsOut(HabitOut):
    logs: List[DailyLogOut] = []

class StreakOut(BaseModel):
    current_streak: int
    best_streak: int

class AnalyticsOut(BaseModel):
    total_habits: int
    active_habits: int
    completion_rate: float
    weekly_data: List[dict]
    heatmap: List[dict]
