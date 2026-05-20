from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base

class ChallengeDinoAssignment(Base):
    __tablename__ = "challenge_dino_assignments"
    __table_args__ = (
        UniqueConstraint("challenge_id", "dino_id", name="uq_challenge_assignment_dino"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    player_id: Mapped[int | None] = mapped_column(ForeignKey("challenge_players.id"), nullable=True, index=True)
    dino_id: Mapped[int] = mapped_column(ForeignKey("dinos.id"), nullable=False, index=True)
    is_tamed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    tamed_by_player_id: Mapped[int | None] = mapped_column(ForeignKey("challenge_players.id"), index=True)
    tamed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[date] = mapped_column(Date, server_default=func.current_date())

    challenge = relationship("Challenge", back_populates="assignments")
    player = relationship("ChallengePlayer", foreign_keys=[player_id], back_populates="assignments")
    tamed_by_player = relationship("ChallengePlayer", foreign_keys=[tamed_by_player_id], back_populates="tamed_assignments")
    dino = relationship("Dino", back_populates="assignments")
