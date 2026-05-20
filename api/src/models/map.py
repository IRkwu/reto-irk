from datetime import date

from sqlalchemy import Boolean, Date, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base


class Map(Base):
    __tablename__ = "maps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_at: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())

    dino_maps = relationship("DinoMap", back_populates="map", cascade="all, delete-orphan")
    spawn_zones = relationship("SpawnZone", back_populates="map", cascade="all, delete-orphan")
    challenges = relationship("Challenge", back_populates="map")
