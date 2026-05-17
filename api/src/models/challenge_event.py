from datetime import date
from enum import StrEnum

from sqlalchemy import Date, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base

class ChallengeEventType(StrEnum):
    life_decreased = "life_decreased"
    life_increased = "life_increased"
    dino_tamed = "dino_tamed"
    dino_untamed = "dino_untamed"
    challenge_started = "challenge_started"
    challenge_completed = "challenge_completed"
    challenge_cancelled = "challenge_cancelled"
    
class ChallengeEvent(Base):
    __tablename__ = "challenge_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    event_type: Mapped[ChallengeEventType] = mapped_column(Enum(ChallengeEventType), nullable=False, index=True)
    player_id: Mapped[int | None] = mapped_column(ForeignKey("challenge_players.id"), index=True)
    dino_id: Mapped[int | None] = mapped_column(ForeignKey("dinos.id"), index=True)
    lives_after: Mapped[int | None] = mapped_column(Integer)
    message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[date] = mapped_column(Date, server_default=func.current_date())

    challenge = relationship("Challenge", back_populates="events")
    player = relationship("ChallengePlayer", back_populates="events")
    dino = relationship("Dino")
