from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.core.security import get_current_admin
from src.database.session import get_db
from src.repositories import challenge_player_repository as challenge_player_repo
from src.repositories import challenge_repository as challenge_repo
from src.repositories import map_repository as map_repo
from src.repositories import spawn_zone_repository as spawn_zone_repo
from src.schemas.spawn_zone import SpawnZoneCreate, SpawnZoneRead, SpawnZoneUpdate

router = APIRouter(prefix="/maps/{map_id}/spawn-zones", tags=["spawn zones"])

class SpawnZoneBody(BaseModel):
    name: str
    is_active: bool = True

class SpawnZonePatchBody(BaseModel):
    name: str | None = None
    is_active: bool | None = None

def _get_map_or_404(db: Session, map_id: int):
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    return map_item

@router.get("", response_model=list[SpawnZoneRead])
def list_spawn_zones(
    map_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    is_active: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[SpawnZoneRead]:
    _get_map_or_404(db, map_id)
    return spawn_zone_repo.list_spawn_zones(
        db=db,
        skip=skip,
        limit=limit,
        map_id=map_id,
        is_active=is_active,
        search=search,
    )

@router.get("/{spawn_zone_id}", response_model=SpawnZoneRead)
def get_spawn_zone(
    map_id: int,
    spawn_zone_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> SpawnZoneRead:
    _get_map_or_404(db, map_id)
    spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

    if spawn_zone is None or spawn_zone.map_id != map_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zona de spawn no encontrada",
        )

    return spawn_zone

@router.post("", response_model=SpawnZoneRead, status_code=status.HTTP_201_CREATED)
def create_spawn_zone(
    map_id: int,
    spawn_zone_data: SpawnZoneBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> SpawnZoneRead:
    _get_map_or_404(db, map_id)
    return spawn_zone_repo.create_spawn_zone(
        db,
        SpawnZoneCreate(map_id=map_id, **spawn_zone_data.model_dump()),
    )

@router.patch("/{spawn_zone_id}", response_model=SpawnZoneRead)
def update_spawn_zone(
    map_id: int,
    spawn_zone_id: int,
    spawn_zone_data: SpawnZonePatchBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> SpawnZoneRead:
    _get_map_or_404(db, map_id)
    spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

    if spawn_zone is None or spawn_zone.map_id != map_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zona de spawn no encontrada",
        )

    return spawn_zone_repo.update_spawn_zone(
        db,
        spawn_zone,
        SpawnZoneUpdate(**spawn_zone_data.model_dump(exclude_unset=True)),
    )

@router.patch("/{spawn_zone_id}/activate", response_model=SpawnZoneRead)
def activate_spawn_zone(
    map_id: int,
    spawn_zone_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> SpawnZoneRead:
    _get_map_or_404(db, map_id)
    spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

    if spawn_zone is None or spawn_zone.map_id != map_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zona de spawn no encontrada",
        )

    return spawn_zone_repo.set_spawn_zone_active(db, spawn_zone, True)

@router.patch("/{spawn_zone_id}/deactivate", response_model=SpawnZoneRead)
def deactivate_spawn_zone(
    map_id: int,
    spawn_zone_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> SpawnZoneRead:
    _get_map_or_404(db, map_id)
    spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

    if spawn_zone is None or spawn_zone.map_id != map_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zona de spawn no encontrada",
        )

    return spawn_zone_repo.set_spawn_zone_active(db, spawn_zone, False)

@router.delete("/{spawn_zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_spawn_zone(
    map_id: int,
    spawn_zone_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    _get_map_or_404(db, map_id)
    spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

    if spawn_zone is None or spawn_zone.map_id != map_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zona de spawn no encontrada",
        )

    if challenge_repo.has_challenges_for_spawn_zone(
        db,
        spawn_zone_id,
    ) or challenge_player_repo.has_challenge_players_for_spawn_zone(
        db,
        spawn_zone_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar la zona porque esta asignada a un reto o jugador",
        )

    spawn_zone_repo.delete_spawn_zone(db, spawn_zone)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
