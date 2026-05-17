from sqlalchemy.orm import Session

from src.models.spawn_zone import SpawnZone
from src.schemas.spawn_zone import SpawnZoneCreate, SpawnZoneUpdate

def get_spawn_zone(db: Session, spawn_zone_id: int) -> SpawnZone | None:
    return db.query(SpawnZone).filter(SpawnZone.id == spawn_zone_id).one_or_none()

def list_spawn_zones(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    map_id: int | None = None,
    is_active: bool | None = None,
    search: str | None = None,
) -> list[SpawnZone]:
    query = db.query(SpawnZone)

    if map_id is not None:
        query = query.filter(SpawnZone.map_id == map_id)

    if is_active is not None:
        query = query.filter(SpawnZone.is_active == is_active)

    if search:
        query = query.filter(SpawnZone.name.ilike(f"%{search}%"))

    return query.order_by(SpawnZone.name.asc()).offset(skip).limit(limit).all()

def create_spawn_zone(db: Session, spawn_zone_data: SpawnZoneCreate) -> SpawnZone:
    spawn_zone = SpawnZone(**spawn_zone_data.model_dump())
    db.add(spawn_zone)
    db.commit()
    db.refresh(spawn_zone)
    return spawn_zone

def update_spawn_zone(
    db: Session,
    spawn_zone: SpawnZone,
    spawn_zone_data: SpawnZoneUpdate,
) -> SpawnZone:
    update_data = spawn_zone_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(spawn_zone, field, value)

    db.commit()
    db.refresh(spawn_zone)
    return spawn_zone

def set_spawn_zone_active(db: Session, spawn_zone: SpawnZone, is_active: bool) -> SpawnZone:
    spawn_zone.is_active = is_active
    db.commit()
    db.refresh(spawn_zone)
    return spawn_zone

def delete_spawn_zone(db: Session, spawn_zone: SpawnZone) -> None:
    db.delete(spawn_zone)
    db.commit()
