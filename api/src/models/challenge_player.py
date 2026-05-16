from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base

class ChallengePlayer(Base):
    __tablename__ = "challenge_players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    challenge = relationship("Challenge", back_populates="players")
    assignments = relationship("ChallengeDinoAssignment", back_populates="player", foreign_keys="ChallengeDinoAssignment.player_id")
    tamed_assignments = relationship("ChallengeDinoAssignment", back_populates="tamed_by_player", foreign_keys="ChallengeDinoAssignment.tamed_by_player_id")
    events = relationship("ChallengeEvent", back_populates="player")
