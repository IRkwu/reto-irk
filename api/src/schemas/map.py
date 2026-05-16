from datetime import datetime

from pydantic import BaseModel, ConfigDict

class MapCreate(BaseModel):
    slug: str
    name: str
    is_active: bool = True

class MapUpdate(BaseModel):
    slug: str | None = None
    name: str | None = None
    is_active: bool | None = None

class MapRead(BaseModel):
    id: int
    slug: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
