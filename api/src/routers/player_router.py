from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from src.core.security import get_current_admin
from src.database.session import get_db
from src.repositories import player_repository as player_repo
from src.schemas.player import PlayerCreate, PlayerRead, PlayerStatsRead, PlayerUpdate

router = APIRouter(prefix="/players", tags=["players"])

def _get_player_or_404(db: Session, player_id: int):
    player = player_repo.get_player(db, player_id)

    if player is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jugador no encontrado",
        )

    return player

def _ensure_unique_name(db: Session, name: str, player_id: int | None = None) -> None:
    existing_player = player_repo.get_player_by_name(db, name)

    if existing_player is not None and existing_player.id != player_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un jugador con ese nombre",
        )

@router.get("", response_model=list[PlayerRead])
def list_players(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    name: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[PlayerRead]:
    return player_repo.list_players(
        db=db,
        skip=skip,
        limit=limit,
        name=name,
        is_active=is_active,
    )

@router.get("/{player_id}", response_model=PlayerRead)
def get_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> PlayerRead:
    return _get_player_or_404(db, player_id)

@router.get("/{player_id}/stats", response_model=PlayerStatsRead)
def get_player_stats(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> PlayerStatsRead:
    player = _get_player_or_404(db, player_id)
    return player_repo.get_player_stats(db, player)

@router.post("", response_model=PlayerRead, status_code=status.HTTP_201_CREATED)
def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> PlayerRead:
    _ensure_unique_name(db, player_data.name)
    return player_repo.create_player(db, player_data)

@router.patch("/{player_id}", response_model=PlayerRead)
def update_player(
    player_id: int,
    player_data: PlayerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> PlayerRead:
    player = _get_player_or_404(db, player_id)

    if player_data.name is not None:
        _ensure_unique_name(db, player_data.name, player.id)

    return player_repo.update_player(db, player, player_data)

@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    player = _get_player_or_404(db, player_id)

    if player_repo.player_has_participations(db, player.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar un jugador con participaciones en desafios",
        )

    player_repo.delete_player(db, player)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
