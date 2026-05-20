from datetime import date

from pydantic import BaseModel, ConfigDict

class DinoCreate(BaseModel):
    name: str
    image_url: str | None = None
    game: str = "ark_survival_evolved"
    is_active: bool = True

class DinoUpdate(BaseModel):
    name: str | None = None
    image_url: str | None = None
    game: str | None = None
    is_active: bool | None = None

class DinoRead(BaseModel):
    id: int
    name: str
    image_url: str | None
    game: str
    is_active: bool
    created_at: date
    updated_at: date

    model_config = ConfigDict(from_attributes=True)
