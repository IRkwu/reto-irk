from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

MapGame = Literal["ark_survival_evolved", "ark_survival_ascended"]

class MapCreate(BaseModel):
    name: str
    image_url: str | None = None
    game: MapGame = "ark_survival_evolved"
    is_active: bool = True

class MapUpdate(BaseModel):
    name: str | None = None
    image_url: str | None = None
    game: MapGame | None = None
    is_active: bool | None = None

    @field_validator("game")
    @classmethod
    def game_must_not_be_null(cls, value: MapGame | None) -> MapGame:
        if value is None:
            raise ValueError("game no puede ser nulo")

        return value

class MapRead(BaseModel):
    id: int
    name: str
    image_url: str | None
    game: MapGame
    is_active: bool
    created_at: date

    model_config = ConfigDict(from_attributes=True)
