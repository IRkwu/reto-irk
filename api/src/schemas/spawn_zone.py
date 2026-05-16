from pydantic import BaseModel, ConfigDict

class SpawnZoneCreate(BaseModel):
    map_id: int
    name: str
    description: str | None = None
    is_active: bool = True

class SpawnZoneUpdate(BaseModel):
    map_id: int | None = None
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None

class SpawnZoneRead(BaseModel):
    id: int
    map_id: int
    name: str
    description: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
