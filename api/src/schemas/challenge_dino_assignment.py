from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

class ChallengeDinoAssignmentCreate(BaseModel):
    challenge_id: int
    player_id: int | None = None
    dino_id: int
    is_tamed: bool = False

class ChallengeDinoAssignmentUpdate(BaseModel):
    player_id: int | None = None
    dino_id: int | None = None
    is_tamed: bool | None = None
    tamed_by_player_id: int | None = None
    tamed_at: datetime | None = None

class ChallengeDinoAssignmentRead(BaseModel):
    id: int
    challenge_id: int
    player_id: int | None
    dino_id: int
    is_tamed: bool
    tamed_by_player_id: int | None
    tamed_at: datetime | None
    created_at: date

    model_config = ConfigDict(from_attributes=True)
