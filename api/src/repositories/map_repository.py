from sqlalchemy import func
from sqlalchemy.orm import Session

from src.models.map import Map
from src.schemas.map import MapCreate, MapUpdate

def get_map(db: Session, map_id: int) -> Map | None:
    return db.query(Map).filter(Map.id == map_id).one_or_none()

def get_map_by_name(db: Session, name: str) -> Map | None:
    clean_name = name.strip().lower()
    return db.query(Map).filter(func.lower(Map.name) == clean_name).one_or_none()

def list_maps(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
    search: str | None = None,
) -> list[Map]:
    query = db.query(Map)

    if is_active is not None:
        query = query.filter(Map.is_active == is_active)

    if search:
        query = query.filter(Map.name.ilike(f"%{search}%"))

    return query.order_by(Map.name.asc()).offset(skip).limit(limit).all()

def create_map(db: Session, map_data: MapCreate) -> Map:
    map_item = Map(**map_data.model_dump())
    db.add(map_item)
    db.commit()
    db.refresh(map_item)
    return map_item

def update_map(db: Session, map_item: Map, map_data: MapUpdate) -> Map:
    update_data = map_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(map_item, field, value)

    db.commit()
    db.refresh(map_item)
    return map_item

def set_map_active(db: Session, map_item: Map, is_active: bool) -> Map:
    map_item.is_active = is_active
    db.commit()
    db.refresh(map_item)
    return map_item

def delete_map(db: Session, map_item: Map) -> None:
    db.delete(map_item)
    db.commit()
