from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base

class ChallengeStatus(StrEnum):
    draft = "draft"
    active = "active"
    completed = "completed"
    cancelled = "cancelled"

class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    map_id: Mapped[int] = mapped_column(ForeignKey("maps.id"), nullable=False, index=True)
    spawn_zone_id: Mapped[int | None] = mapped_column(ForeignKey("spawn_zones.id"), nullable=True, index=True)
    status: Mapped[ChallengeStatus] = mapped_column(Enum(ChallengeStatus), default=ChallengeStatus.draft, nullable=False, index=True)
    player_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    base_lives_per_player: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    current_lives: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    map = relationship("Map", back_populates="challenges")
    spawn_zone = relationship("SpawnZone", back_populates="challenges")
    players = relationship("ChallengePlayer", back_populates="challenge", cascade="all, delete-orphan")
    assignments = relationship("ChallengeDinoAssignment", back_populates="challenge", cascade="all, delete-orphan")
    events = relationship("ChallengeEvent", back_populates="challenge", cascade="all, delete-orphan")
