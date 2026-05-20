from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from src.core.challenge_rules import (
    DEFAULT_BASE_LIVES_PER_PLAYER,
    DEFAULT_PLAYER_COUNT,
    MAX_PLAYERS_PER_CHALLENGE,
    MIN_BASE_LIVES_PER_PLAYER,
    MIN_PLAYERS_PER_CHALLENGE,
)

ChallengeStatusValue = Literal["draft", "active", "completed", "cancelled"]

class ChallengeCreate(BaseModel):
    name: str
    map_id: int
    spawn_zone_id: int | None = None
    player_count: int = Field(
        default=DEFAULT_PLAYER_COUNT,
        ge=MIN_PLAYERS_PER_CHALLENGE,
        le=MAX_PLAYERS_PER_CHALLENGE,
    )
    base_lives_per_player: int = Field(
        default=DEFAULT_BASE_LIVES_PER_PLAYER,
        ge=MIN_BASE_LIVES_PER_PLAYER,
    )

class ChallengeUpdate(BaseModel):
    name: str | None = None
    map_id: int | None = None
    spawn_zone_id: int | None = None
    status: ChallengeStatusValue | None = None
    player_count: int | None = Field(
        default=None,
        ge=MIN_PLAYERS_PER_CHALLENGE,
        le=MAX_PLAYERS_PER_CHALLENGE,
    )
    base_lives_per_player: int | None = Field(
        default=None,
        ge=MIN_BASE_LIVES_PER_PLAYER,
    )
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
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)
