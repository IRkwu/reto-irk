from pydantic import BaseModel

from src.models.challenge_event import ChallengeEventType

class LivesChangeBody(BaseModel):
    player_id: int | None = None
    dino_id: int | None = None
    message: str | None = None

class ChallengeEventBody(BaseModel):
    event_type: ChallengeEventType
    player_id: int | None = None
    dino_id: int | None = None
    lives_after: int | None = None
    message: str | None = None
