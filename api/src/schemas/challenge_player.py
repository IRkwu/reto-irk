from pydantic import BaseModel, ConfigDict, Field

class ChallengePlayerCreate(BaseModel):
    challenge_id: int
    name: str
    position: int = Field(..., ge=1, le=4)
    is_active: bool = True

class ChallengePlayerUpdate(BaseModel):
    name: str | None = None
    position: int | None = Field(default=None, ge=1, le=4)
    is_active: bool | None = None

class ChallengePlayerRead(BaseModel):
    id: int
    challenge_id: int
    name: str
    position: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
