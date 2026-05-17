from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.core.security import get_current_admin
from src.database.session import get_db
from src.models.challenge import ChallengeStatus
from src.repositories import challenge_player_repository as player_repo
from src.repositories import challenge_repository as challenge_repo
from src.schemas.challenge_player import ChallengePlayerCreate, ChallengePlayerRead, ChallengePlayerUpdate
from src.utils.websocket_manager import websocket_manager

router = APIRouter(prefix="/challenges/{challenge_id}/players", tags=["challenge players"])

class ChallengePlayerBody(BaseModel):
    name: str
    position: int = Field(..., ge=1, le=4)
    is_active: bool = True

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafío no encontrado",
        )

    return challenge

def _get_player_or_404(db: Session, challenge_id: int, player_id: int):
    player = player_repo.get_challenge_player(db, player_id)

    if player is None or player.challenge_id != challenge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jugador no encontrado en este desafío",
        )

    return player

def _ensure_draft_challenge(challenge) -> None:
    if challenge.status != ChallengeStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden editar jugadores mientras el desafío esté en borrador",
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
            detail="La posición supera la cantidad de jugadores del desafío",
        )

    existing_player = player_repo.get_challenge_player_by_position(
        db=db,
        challenge_id=challenge_id,
        position=player_data.position,
    )

    if existing_player is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un jugador en esa posición",
        )

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
                detail="La posición supera la cantidad de jugadores del desafío",
            )

        existing_player = player_repo.get_challenge_player_by_position(
            db=db,
            challenge_id=challenge_id,
            position=player_data.position,
        )

        if existing_player is not None and existing_player.id != player.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un jugador en esa posición",
            )

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
    player_repo.delete_challenge_player(db, player)
    await websocket_manager.broadcast(challenge_id, {"type": "player_deleted", "challenge_id": challenge_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
