from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.core.challenge_rules import MAX_PLAYERS_PER_CHALLENGE, MIN_PLAYERS_PER_CHALLENGE
from src.core.security import get_current_admin
from src.database.session import get_db
from src.models.challenge import ChallengeStatus
from src.repositories import challenge_dino_assignment_repository as assignment_repo
from src.repositories import challenge_player_repository as player_repo
from src.repositories import challenge_repository as challenge_repo
from src.repositories import player_repository as global_player_repo
from src.repositories import spawn_zone_repository as spawn_zone_repo
from src.schemas.challenge_player import ChallengePlayerCreate, ChallengePlayerRead, ChallengePlayerUpdate
from src.utils.websocket_manager import websocket_manager

router = APIRouter(prefix="/challenges/{challenge_id}/players", tags=["challenge players"])

class ChallengePlayerBody(BaseModel):
    player_id: int
    spawn_zone_id: int | None = None
    position: int = Field(..., ge=MIN_PLAYERS_PER_CHALLENGE, le=MAX_PLAYERS_PER_CHALLENGE)
    is_active: bool = True

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafio no encontrado",
        )

    return challenge

def _get_player_or_404(db: Session, challenge_id: int, player_id: int):
    player = player_repo.get_challenge_player(db, player_id)

    if player is None or player.challenge_id != challenge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jugador no encontrado en este desafio",
        )

    return player

def _get_global_player_or_404(db: Session, player_id: int):
    player = global_player_repo.get_player(db, player_id)

    if player is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jugador no encontrado",
        )

    if not player.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El jugador esta inactivo",
        )

    return player

def _ensure_draft_challenge(challenge) -> None:
    if challenge.status != ChallengeStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden editar jugadores mientras el desafio este en borrador",
        )

def _ensure_position_available(db: Session, challenge_id: int, position: int, current_id: int | None = None) -> None:
    existing_player = player_repo.get_challenge_player_by_position(
        db=db,
        challenge_id=challenge_id,
        position=position,
    )

    if existing_player is not None and existing_player.id != current_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un jugador en esa posicion",
        )

def _ensure_profile_available(db: Session, challenge_id: int, player_id: int, current_id: int | None = None) -> None:
    existing_player = player_repo.get_challenge_player_by_profile(
        db=db,
        challenge_id=challenge_id,
        player_id=player_id,
    )

    if existing_player is not None and existing_player.id != current_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El jugador ya esta asignado a este desafio",
        )

def _ensure_spawn_zone_matches_challenge(db: Session, challenge, spawn_zone_id: int | None) -> None:
    if spawn_zone_id is None:
        return

    spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

    if spawn_zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zona de spawn no encontrada",
        )

    if spawn_zone.map_id != challenge.map_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La zona de spawn no pertenece al mapa del desafio",
        )

def _ensure_spawn_zone_available(
    db: Session,
    challenge_id: int,
    spawn_zone_id: int | None,
    current_id: int | None = None,
) -> None:
    if spawn_zone_id is None:
        return

    existing_player = player_repo.get_challenge_player_by_spawn_zone(
        db=db,
        challenge_id=challenge_id,
        spawn_zone_id=spawn_zone_id,
    )

    if existing_player is not None and existing_player.id != current_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La zona de spawn ya esta asignada a otro jugador",
        )

@router.get("", response_model=list[ChallengePlayerRead])
def list_challenge_players(
    challenge_id: int,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[ChallengePlayerRead]:
    _get_challenge_or_404(db, challenge_id)
    return player_repo.list_challenge_players(db, challenge_id, is_active)

@router.post("", response_model=ChallengePlayerRead, status_code=status.HTTP_201_CREATED)
async def create_challenge_player(
    challenge_id: int,
    player_data: ChallengePlayerBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengePlayerRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_draft_challenge(challenge)

    if player_data.position > challenge.player_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La posicion supera la cantidad de jugadores del desafio",
        )

    _get_global_player_or_404(db, player_data.player_id)
    _ensure_spawn_zone_matches_challenge(db, challenge, player_data.spawn_zone_id)
    _ensure_spawn_zone_available(db, challenge_id, player_data.spawn_zone_id)
    _ensure_profile_available(db, challenge_id, player_data.player_id)
    _ensure_position_available(db, challenge_id, player_data.position)

    player = player_repo.create_challenge_player(
        db=db,
        player_data=ChallengePlayerCreate(challenge_id=challenge_id, **player_data.model_dump()),
    )
    await websocket_manager.broadcast(challenge_id, {"type": "player_created", "challenge_id": challenge_id})
    return player

@router.patch("/{player_id}", response_model=ChallengePlayerRead)
async def update_challenge_player(
    challenge_id: int,
    player_id: int,
    player_data: ChallengePlayerUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengePlayerRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_draft_challenge(challenge)
    player = _get_player_or_404(db, challenge_id, player_id)

    if player_data.position is not None:
        if player_data.position > challenge.player_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La posicion supera la cantidad de jugadores del desafio",
            )

        _ensure_position_available(db, challenge_id, player_data.position, player.id)

    if player_data.player_id is not None:
        _get_global_player_or_404(db, player_data.player_id)
        _ensure_profile_available(db, challenge_id, player_data.player_id, player.id)

    if "spawn_zone_id" in player_data.model_fields_set:
        _ensure_spawn_zone_matches_challenge(db, challenge, player_data.spawn_zone_id)
        _ensure_spawn_zone_available(db, challenge_id, player_data.spawn_zone_id, player.id)

    player = player_repo.update_challenge_player(db, player, player_data)
    await websocket_manager.broadcast(challenge_id, {"type": "player_updated", "challenge_id": challenge_id})
    return player

@router.patch("/{player_id}/active", response_model=ChallengePlayerRead)
async def set_challenge_player_active(
    challenge_id: int,
    player_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengePlayerRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_draft_challenge(challenge)
    player = _get_player_or_404(db, challenge_id, player_id)
    player = player_repo.set_challenge_player_active(db, player, is_active)
    await websocket_manager.broadcast(challenge_id, {"type": "player_active_changed", "challenge_id": challenge_id})
    return player

@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_challenge_player(
    challenge_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_draft_challenge(challenge)
    player = _get_player_or_404(db, challenge_id, player_id)
    deleted_assignments = assignment_repo.delete_assignments_for_player(
        db=db,
        challenge_id=challenge_id,
        player_id=player.id,
    )
    player_repo.delete_challenge_player(db, player)
    challenge_repo.sync_draft_lives_with_assignments(db, challenge)
    await websocket_manager.broadcast(
        challenge_id,
        {
            "type": "player_deleted",
            "challenge_id": challenge_id,
            "deleted_assignments": deleted_assignments,
        },
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
