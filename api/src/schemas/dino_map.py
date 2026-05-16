from pydantic import BaseModel, ConfigDict

class DinoMapCreate(BaseModel):
    dino_id: int
    map_id: int
    is_active: bool = True

class DinoMapRead(BaseModel):
    id: int
    dino_id: int
    map_id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
