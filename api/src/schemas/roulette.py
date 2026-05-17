from pydantic import BaseModel

from src.schemas.challenge_dino_assignment import ChallengeDinoAssignmentRead
from src.schemas.dino import DinoRead

class RouletteRollRead(BaseModel):
    dino: DinoRead

class RouletteAssignBody(BaseModel):
    dino_id: int
    player_id: int | None = None

class RouletteAssignRead(BaseModel):
    assignment: ChallengeDinoAssignmentRead
