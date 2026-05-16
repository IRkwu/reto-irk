from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base


class Dino(Base):
    __tablename__ = "dinos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    game: Mapped[str] = mapped_column(String(100), default="ark_survival_evolved", nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    dino_maps = relationship("DinoMap", back_populates="dino", cascade="all, delete-orphan")
    assignments = relationship("ChallengeDinoAssignment", back_populates="dino")
