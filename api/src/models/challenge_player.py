from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base

class ChallengePlayer(Base):
    __tablename__ = "challenge_players"
    __table_args__ = (
        UniqueConstraint("challenge_id", "player_id", name="uq_challenge_player_profile"),
        UniqueConstraint("challenge_id", "position", name="uq_challenge_player_position"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id"), nullable=False, index=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False, index=True)
    spawn_zone_id: Mapped[int | None] = mapped_column(ForeignKey("spawn_zones.id"), nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    challenge = relationship("Challenge", back_populates="players")
    player = relationship("Player", back_populates="challenge_players")
    spawn_zone = relationship("SpawnZone")
    assignments = relationship("ChallengeDinoAssignment", back_populates="player", foreign_keys="ChallengeDinoAssignment.player_id")
    tamed_assignments = relationship("ChallengeDinoAssignment", back_populates="tamed_by_player", foreign_keys="ChallengeDinoAssignment.tamed_by_player_id")
    events = relationship("ChallengeEvent", back_populates="player")
