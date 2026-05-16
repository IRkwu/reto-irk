from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

ChallengeEventTypeValue = Literal[
    "life_decreased",
    "life_increased",
    "dino_tamed",
    "dino_untamed",
    "challenge_started",
    "challenge_completed",
    "challenge_cancelled",
]

class ChallengeEventRead(BaseModel):
    id: int
    challenge_id: int
    event_type: ChallengeEventTypeValue
    player_id: int | None
    dino_id: int | None
    lives_after: int | None
    message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
