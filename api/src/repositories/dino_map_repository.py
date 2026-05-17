from sqlalchemy.orm import Session

from src.models.dino_map import DinoMap
from src.schemas.dino_map import DinoMapCreate

def get_dino_map(db: Session, dino_map_id: int) -> DinoMap | None:
    return db.query(DinoMap).filter(DinoMap.id == dino_map_id).one_or_none()

def get_dino_map_by_pair(db: Session, dino_id: int, map_id: int) -> DinoMap | None:
    return (
        db.query(DinoMap)
        .filter(DinoMap.dino_id == dino_id, DinoMap.map_id == map_id)
        .one_or_none()
    )

def list_dino_maps(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    dino_id: int | None = None,
    map_id: int | None = None,
    is_active: bool | None = None,
) -> list[DinoMap]:
    query = db.query(DinoMap)

    if dino_id is not None:
        query = query.filter(DinoMap.dino_id == dino_id)

    if map_id is not None:
        query = query.filter(DinoMap.map_id == map_id)

    if is_active is not None:
        query = query.filter(DinoMap.is_active == is_active)

    return query.order_by(DinoMap.id.asc()).offset(skip).limit(limit).all()

def create_dino_map(db: Session, dino_map_data: DinoMapCreate) -> DinoMap:
    dino_map = DinoMap(**dino_map_data.model_dump())
    db.add(dino_map)
    db.commit()
    db.refresh(dino_map)
    return dino_map

def upsert_dino_map(db: Session, dino_id: int, map_id: int, is_active: bool = True) -> DinoMap:
    dino_map = get_dino_map_by_pair(db, dino_id=dino_id, map_id=map_id)

    if dino_map:
        dino_map.is_active = is_active
    else:
        dino_map = DinoMap(dino_id=dino_id, map_id=map_id, is_active=is_active)
        db.add(dino_map)

    db.commit()
    db.refresh(dino_map)
    return dino_map

def set_dino_map_active(db: Session, dino_map: DinoMap, is_active: bool) -> DinoMap:
    dino_map.is_active = is_active
    db.commit()
    db.refresh(dino_map)
    return dino_map

def delete_dino_map(db: Session, dino_map: DinoMap) -> None:
    db.delete(dino_map)
    db.commit()
