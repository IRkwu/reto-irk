from datetime import date

from sqlalchemy import Boolean, CheckConstraint, Date, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base


class Map(Base):
    __tablename__ = "maps"
    __table_args__ = (
        CheckConstraint(
            "game IN ('ark_survival_evolved', 'ark_survival_ascended')",
            name="ck_maps_game_domain",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    game: Mapped[str] = mapped_column(String(100), default="ark_survival_evolved", nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_at: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())

    dino_maps = relationship("DinoMap", back_populates="map", cascade="all, delete-orphan")
    spawn_zones = relationship("SpawnZone", back_populates="map", cascade="all, delete-orphan")
    challenges = relationship("Challenge", back_populates="map")
