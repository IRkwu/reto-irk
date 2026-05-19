from datetime import date

from pydantic import BaseModel, ConfigDict

class PlayerCreate(BaseModel):
    name: str
    is_active: bool = True

class PlayerUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None

class PlayerRead(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)

class PlayerStatsRead(BaseModel):
    id: int
    name: str
    is_active: bool
    challenges_participated: int
    challenges_completed: int
    dinos_tamed: int
    dinos_not_tamed: int
    dinos_tamed_percentage: float
    dinos_not_tamed_percentage: float

    model_config = ConfigDict(from_attributes=True)
