from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base


class SpawnZone(Base):
    __tablename__ = "spawn_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    map_id: Mapped[int] = mapped_column(ForeignKey("maps.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    map = relationship("Map", back_populates="spawn_zones")
    challenges = relationship("Challenge", back_populates="spawn_zone")
