from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.base import Base


class DinoMap(Base):
    __tablename__ = "dino_maps"
    __table_args__ = (UniqueConstraint("dino_id", "map_id", name="uq_dino_map"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dino_id: Mapped[int] = mapped_column(ForeignKey("dinos.id"), nullable=False, index=True)
    map_id: Mapped[int] = mapped_column(ForeignKey("maps.id"), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    dino = relationship("Dino", back_populates="dino_maps")
    map = relationship("Map", back_populates="dino_maps")
