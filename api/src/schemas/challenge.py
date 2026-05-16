from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ChallengeStatusValue = Literal["draft", "active", "completed", "cancelled"]

class ChallengeCreate(BaseModel):
    name: str
    map_id: int
    spawn_zone_id: int | None = None
    player_count: int = Field(default=1, ge=1, le=4)
    base_lives_per_player: int = Field(default=10, ge=1)

class ChallengeUpdate(BaseModel):
    name: str | None = None
    map_id: int | None = None
    spawn_zone_id: int | None = None
    status: ChallengeStatusValue | None = None
    player_count: int | None = Field(default=None, ge=1, le=4)
    base_lives_per_player: int | None = Field(default=None, ge=1)
    current_lives: int | None = None

class ChallengeRead(BaseModel):
    id: int
    name: str
    map_id: int
    spawn_zone_id: int | None
    status: ChallengeStatusValue
    player_count: int
    base_lives_per_player: int
    current_lives: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
