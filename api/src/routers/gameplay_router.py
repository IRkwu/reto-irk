from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.core.security import get_current_admin
from src.database.session import get_db
from src.models.challenge_event import ChallengeEventType
from src.repositories import challenge_event_repository as event_repo
from src.repositories import challenge_player_repository as player_repo
from src.repositories import challenge_repository as challenge_repo
from src.repositories import dino_repository as dino_repo
from src.schemas.challenge import ChallengeRead
from src.schemas.challenge_event import ChallengeEventRead
from src.schemas.gameplay import LivesChangeBody, ChallengeEventBody
from src.utils.websocket_manager import websocket_manager

router = APIRouter(tags=["gameplay"])

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafío no encontrado",
        )

    return challenge

def _validate_optional_references(
    db: Session,
    challenge_id: int,
    player_id: int | None,
    dino_id: int | None,
) -> None:
    if player_id is not None:
        player = player_repo.get_challenge_player(db, player_id)

        if player is None or player.challenge_id != challenge_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jugador no encontrado en este desafío",
            )

    if dino_id is not None and dino_repo.get_dino(db, dino_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

@router.post("/challenges/{challenge_id}/lives/decrease", response_model=ChallengeRead)
async def decrease_lives(
    challenge_id: int,
    lives_data: LivesChangeBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _validate_optional_references(
        db,
        challenge_id,
        lives_data.player_id,
        lives_data.dino_id,
    )

    challenge = challenge_repo.decrease_challenge_lives(
        db,
        challenge,
        1,
    )

    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge_id,
        event_type=ChallengeEventType.life_decreased,
        player_id=lives_data.player_id,
        dino_id=lives_data.dino_id,
        lives_after=challenge.current_lives,
        message=lives_data.message or "Vida descontada",
    )

    await websocket_manager.broadcast(
        challenge_id,
        {
            "type": "life_decreased",
            "challenge_id": challenge_id,
            "current_lives": challenge.current_lives,
        },
    )

    return challenge

@router.post("/challenges/{challenge_id}/lives/increase", response_model=ChallengeRead)
async def increase_lives(
    challenge_id: int,
    lives_data: LivesChangeBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _validate_optional_references(
        db,
        challenge_id,
        lives_data.player_id,
        lives_data.dino_id,
    )

    challenge = challenge_repo.increase_challenge_lives(
        db,
        challenge,
        1,
    )

    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge_id,
        event_type=ChallengeEventType.life_increased,
        player_id=lives_data.player_id,
        dino_id=lives_data.dino_id,
        lives_after=challenge.current_lives,
        message=lives_data.message or "Vida agregada",
    )

    await websocket_manager.broadcast(
        challenge_id,
        {
            "type": "life_increased",
            "challenge_id": challenge_id,
            "current_lives": challenge.current_lives,
        },
    )

    return challenge

@router.get("/challenges/{challenge_id}/events", response_model=list[ChallengeEventRead])
def list_challenge_events(
    challenge_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    event_type: ChallengeEventType | None = None,
    player_id: int | None = None,
    dino_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[ChallengeEventRead]:
    _get_challenge_or_404(db, challenge_id)

    return event_repo.list_challenge_events(
        db=db,
        challenge_id=challenge_id,
        skip=skip,
        limit=limit,
        event_type=event_type,
        player_id=player_id,
        dino_id=dino_id,
    )

@router.post(
    "/challenges/{challenge_id}/events",
    response_model=ChallengeEventRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_challenge_event(
    challenge_id: int,
    event_data: ChallengeEventBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeEventRead:
    _get_challenge_or_404(db, challenge_id)

    _validate_optional_references(
        db,
        challenge_id,
        event_data.player_id,
        event_data.dino_id,
    )

    event = event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge_id,
        event_type=event_data.event_type,
        player_id=event_data.player_id,
        dino_id=event_data.dino_id,
        lives_after=event_data.lives_after,
        message=event_data.message,
    )

    await websocket_manager.broadcast(
        challenge_id,
        {
            "type": "event_created",
            "challenge_id": challenge_id,
        },
    )

    return event
