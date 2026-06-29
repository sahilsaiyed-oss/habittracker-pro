from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Habit Tracker Pro: Global Configuration.
    Loads variables from the '.env' file located in the root of the backend.
    """
    
    # 1. DATABASE CONFIGURATION
    # Default is local SQLite. In production, this will be a PostgreSQL URL.
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    # 2. SECURITY & AUTHENTICATION (JWT)
    # Used for signing tokens. Change this to a random string in production.
    SECRET_KEY: str = "HABIT_PRO_ULTRA_SECRET_KEY_2026"
    ALGORITHM: str = "HS256"
    # Token lifespan (Current: 7 Days)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 

    # 3. ARTIFICIAL INTELLIGENCE (GROQ)
    # These must be set in your .env file
    GROQ_API_KEY: str = "REPLACE_WITH_REAL_KEY"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    class Config:
        # Enforces loading from the .env file
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()