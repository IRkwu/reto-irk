from pydantic import BaseModel, ConfigDict, Field

from src.core.challenge_rules import MAX_PLAYERS_PER_CHALLENGE, MIN_PLAYERS_PER_CHALLENGE
from src.schemas.player import PlayerRead
from src.schemas.spawn_zone import SpawnZoneRead

class ChallengePlayerCreate(BaseModel):
    challenge_id: int
    player_id: int
    spawn_zone_id: int | None = None
    position: int = Field(..., ge=MIN_PLAYERS_PER_CHALLENGE, le=MAX_PLAYERS_PER_CHALLENGE)
    is_active: bool = True

class ChallengePlayerUpdate(BaseModel):
    player_id: int | None = None
    spawn_zone_id: int | None = None
    position: int | None = Field(
        default=None,
        ge=MIN_PLAYERS_PER_CHALLENGE,
        le=MAX_PLAYERS_PER_CHALLENGE,
    )
    is_active: bool | None = None

class ChallengePlayerRead(BaseModel):
    id: int
    challenge_id: int
    player_id: int
    player: PlayerRead
    spawn_zone_id: int | None
    spawn_zone: SpawnZoneRead | None
    position: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
