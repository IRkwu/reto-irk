from sqlalchemy import func
from sqlalchemy.orm import Session

from src.models.challenge_dino_assignment import ChallengeDinoAssignment
from src.models.challenge_event import ChallengeEvent
from src.models.dino import Dino
from src.models.dino_map import DinoMap
from src.schemas.dino import DinoCreate, DinoUpdate

def get_dino(db: Session, dino_id: int) -> Dino | None:
    return db.query(Dino).filter(Dino.id == dino_id).one_or_none()

def get_dino_by_name(db: Session, name: str) -> Dino | None:
    clean_name = name.strip().lower()
    return db.query(Dino).filter(func.lower(Dino.name) == clean_name).one_or_none()

def list_dinos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    name: str | None = None,
    game: str | None = None,
    is_active: bool | None = None,
    map_id: int | None = None,
    search: str | None = None,
) -> list[Dino]:
    query = db.query(Dino)

    if map_id is not None:
        query = query.join(DinoMap).filter(DinoMap.map_id == map_id, DinoMap.is_active == True)

    if is_active is not None:
        query = query.filter(Dino.is_active == is_active)

    if name:
        query = query.filter(Dino.name.ilike(f"%{name}%"))

    if search:
        query = query.filter(Dino.name.ilike(f"%{search}%"))

    if game:
        query = query.filter(Dino.game == game)

    return query.order_by(Dino.name.asc()).offset(skip).limit(limit).all()

def create_dino(db: Session, dino_data: DinoCreate) -> Dino:
    dino = Dino(**dino_data.model_dump())
    db.add(dino)
    db.commit()
    db.refresh(dino)
    return dino

def update_dino(db: Session, dino: Dino, dino_data: DinoUpdate) -> Dino:
    update_data = dino_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(dino, field, value)

    db.commit()
    db.refresh(dino)
    return dino

def set_dino_active(db: Session, dino: Dino, is_active: bool) -> Dino:
    dino.is_active = is_active
    db.commit()
    db.refresh(dino)
    return dino

def has_challenge_usage(db: Session, dino_id: int) -> bool:
    assignment_exists = (
        db.query(ChallengeDinoAssignment.id)
        .filter(ChallengeDinoAssignment.dino_id == dino_id)
        .first()
        is not None
    )

    if assignment_exists:
        return True

    return (
        db.query(ChallengeEvent.id)
        .filter(ChallengeEvent.dino_id == dino_id)
        .first()
        is not None
    )

def delete_dino(db: Session, dino: Dino) -> None:
    db.delete(dino)
    db.commit()
