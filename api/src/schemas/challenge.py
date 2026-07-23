from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from src.core.challenge_rules import (
    DEFAULT_PLAYER_COUNT,
    MAX_PLAYERS_PER_CHALLENGE,
    MIN_PLAYERS_PER_CHALLENGE,
)

ChallengeStatusValue = Literal["draft", "active", "completed", "cancelled"]
ChallengeGame = Literal["ark_survival_evolved", "ark_survival_ascended"]

class ChallengeCreate(BaseModel):
    name: str
    map_id: int
    game: ChallengeGame = "ark_survival_evolved"
    spawn_zone_id: int | None = None
    player_count: int = Field(
        default=DEFAULT_PLAYER_COUNT,
        ge=MIN_PLAYERS_PER_CHALLENGE,
        le=MAX_PLAYERS_PER_CHALLENGE,
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
    current_lives: int | None = None

class ChallengeRead(BaseModel):
    id: int
    name: str
    map_id: int
    game: ChallengeGame
    spawn_zone_id: int | None
    status: ChallengeStatusValue
    player_count: int
    current_lives: int
    completed_dinos_count: int
    total_dinos_count: int
    started_at: datetime | None
    completed_at: datetime | None
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)
