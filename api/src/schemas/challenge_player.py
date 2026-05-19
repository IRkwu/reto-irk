from pydantic import BaseModel, ConfigDict, Field

from src.schemas.player import PlayerRead

class ChallengePlayerCreate(BaseModel):
    challenge_id: int
    player_id: int
    position: int = Field(..., ge=1, le=4)
    is_active: bool = True

class ChallengePlayerUpdate(BaseModel):
    player_id: int | None = None
    position: int | None = Field(default=None, ge=1, le=4)
    is_active: bool | None = None

class ChallengePlayerRead(BaseModel):
    id: int
    challenge_id: int
    player_id: int
    player: PlayerRead
    position: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
