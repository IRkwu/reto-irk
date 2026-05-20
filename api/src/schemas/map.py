from datetime import date

from pydantic import BaseModel, ConfigDict

class MapCreate(BaseModel):
    name: str
    image_url: str | None = None
    is_active: bool = True

class MapUpdate(BaseModel):
    name: str | None = None
    image_url: str | None = None
    is_active: bool | None = None

class MapRead(BaseModel):
    id: int
    name: str
    image_url: str | None
    is_active: bool
    created_at: date

    model_config = ConfigDict(from_attributes=True)
