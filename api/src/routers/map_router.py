from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from src.core.security import get_current_admin
from src.database.session import get_db
from src.repositories import challenge_repository as challenge_repo
from src.repositories import dino_map_repository as dino_map_repo
from src.repositories import dino_repository as dino_repo
from src.repositories import map_repository as map_repo
from src.schemas.dino_map import DinoMapRead
from src.schemas.map import MapCreate, MapGame, MapRead, MapUpdate

router = APIRouter(prefix="/maps", tags=["maps"])

@router.get("", response_model=list[MapRead])
def list_maps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    is_active: bool | None = None,
    search: str | None = None,
    game: MapGame | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[MapRead]:
    return map_repo.list_maps(
        db=db,
        skip=skip,
        limit=limit,
        is_active=is_active,
        search=search,
        game=game,
    )

@router.get("/{map_id}", response_model=MapRead)
def get_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> MapRead:
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    return map_item

@router.post("", response_model=MapRead, status_code=status.HTTP_201_CREATED)
def create_map(
    map_data: MapCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> MapRead:
    existing_map = map_repo.get_map_by_name(db, map_data.name)

    if existing_map is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un mapa con ese nombre",
        )

    return map_repo.create_map(db, map_data)

@router.patch("/{map_id}", response_model=MapRead)
def update_map(
    map_id: int,
    map_data: MapUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> MapRead:
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    if map_data.name is not None:
        existing_map = map_repo.get_map_by_name(db, map_data.name)

        if existing_map is not None and existing_map.id != map_item.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un mapa con ese nombre",
            )

    return map_repo.update_map(db, map_item, map_data)

@router.patch("/{map_id}/activate", response_model=MapRead)
def activate_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> MapRead:
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    return map_repo.set_map_active(db, map_item, True)

@router.patch("/{map_id}/deactivate", response_model=MapRead)
def deactivate_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> MapRead:
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    return map_repo.set_map_active(db, map_item, False)

@router.post("/{map_id}/dinos/{dino_id}", response_model=DinoMapRead, status_code=status.HTTP_201_CREATED)
def add_dino_to_map(
    map_id: int,
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoMapRead:
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    return dino_map_repo.upsert_dino_map(
        db=db,
        dino_id=dino_id,
        map_id=map_id,
        is_active=True,
    )

@router.delete("/{map_id}/dinos/{dino_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_dino_from_map(
    map_id: int,
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    dino_map = dino_map_repo.get_dino_map_by_pair(
        db=db,
        dino_id=dino_id,
        map_id=map_id,
    )

    if dino_map is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relacion dino-mapa no encontrada",
        )

    dino_map_repo.delete_dino_map(db, dino_map)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.patch("/{map_id}/dinos/{dino_id}/activate", response_model=DinoMapRead)
def activate_dino_map(
    map_id: int,
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoMapRead:
    dino_map = dino_map_repo.get_dino_map_by_pair(db=db, dino_id=dino_id, map_id=map_id)

    if dino_map is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relacion dino-mapa no encontrada",
        )

    return dino_map_repo.set_dino_map_active(db, dino_map, True)

@router.patch("/{map_id}/dinos/{dino_id}/deactivate", response_model=DinoMapRead)
def deactivate_dino_map(
    map_id: int,
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoMapRead:
    dino_map = dino_map_repo.get_dino_map_by_pair(db=db, dino_id=dino_id, map_id=map_id)

    if dino_map is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relacion dino-mapa no encontrada",
        )

    return dino_map_repo.set_dino_map_active(db, dino_map, False)


@router.delete("/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_map(
    map_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    map_item = map_repo.get_map(db, map_id)

    if map_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    if challenge_repo.has_challenges_for_map(db, map_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar el mapa porque tiene retos asociados",
        )

    map_repo.delete_map(db, map_item)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
