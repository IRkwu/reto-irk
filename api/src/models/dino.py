from datetime import date

from sqlalchemy import Boolean, Date, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base


class Dino(Base):
    __tablename__ = "dinos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    game: Mapped[str] = mapped_column(String(100), default="ark_survival_evolved", nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_at: Mapped[date] = mapped_column(Date, server_default=func.current_date())
    updated_at: Mapped[date] = mapped_column(Date, server_default=func.current_date(), onupdate=func.current_date())

    dino_maps = relationship("DinoMap", back_populates="dino", cascade="all, delete-orphan")
    assignments = relationship("ChallengeDinoAssignment", back_populates="dino")
