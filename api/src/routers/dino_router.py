from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from src.core.security import get_current_admin
from src.database.session import get_db
from src.repositories import dino_repository as dino_repo
from src.repositories import map_repository as map_repo
from src.schemas.dino import DinoCreate, DinoRead, DinoUpdate

router = APIRouter(prefix="/dinos", tags=["dinos"])

@router.get("", response_model=list[DinoRead])
def list_dinos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    name: str | None = None,
    slug: str | None = None,
    game: str | None = None,
    is_active: bool | None = None,
    id_map: int | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[DinoRead]:
    if id_map is not None and map_repo.get_map(db, id_map) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    return dino_repo.list_dinos(
        db=db,
        skip=skip,
        limit=limit,
        name=name,
        slug=slug,
        game=game,
        is_active=is_active,
        map_id=id_map,
    )

@router.get("/{dino_id}", response_model=DinoRead)
def get_dino(
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoRead:
    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    return dino

@router.post("", response_model=DinoRead, status_code=status.HTTP_201_CREATED)
def create_dino(
    dino_data: DinoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoRead:
    existing_dino = dino_repo.get_dino_by_slug(db, dino_data.slug)

    if existing_dino is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un dino con ese slug",
        )

    return dino_repo.create_dino(db, dino_data)

@router.patch("/{dino_id}", response_model=DinoRead)
def update_dino(
    dino_id: int,
    dino_data: DinoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoRead:
    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    if dino_data.slug is not None:
        existing_dino = dino_repo.get_dino_by_slug(db, dino_data.slug)

        if existing_dino is not None and existing_dino.id != dino.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un dino con ese slug",
            )

    return dino_repo.update_dino(db, dino, dino_data)

@router.patch("/{dino_id}/activate", response_model=DinoRead)
def activate_dino(
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoRead:
    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    return dino_repo.set_dino_active(db, dino, True)

@router.patch("/{dino_id}/deactivate", response_model=DinoRead)
def deactivate_dino(
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> DinoRead:
    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    return dino_repo.set_dino_active(db, dino, False)

@router.delete("/{dino_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dino(
    dino_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    dino_repo.delete_dino(db, dino)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
