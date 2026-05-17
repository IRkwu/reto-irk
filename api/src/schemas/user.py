from datetime import date

from pydantic import BaseModel, ConfigDict

class UserRead(BaseModel):
    id: int
    username: str
    is_active: bool
    created_at: date

    model_config = ConfigDict(from_attributes=True)
