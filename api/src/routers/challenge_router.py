from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from src.core.challenge_rules import MAX_DINOS_PER_PLAYER, MIN_DINOS_PER_PLAYER
from src.core.security import get_current_admin
from src.database.session import get_db
from src.models.challenge import ChallengeStatus
from src.models.challenge_event import ChallengeEventType
from src.repositories import challenge_dino_assignment_repository as assignment_repo
from src.repositories import challenge_event_repository as event_repo
from src.repositories import challenge_player_repository as player_repo
from src.repositories import challenge_repository as challenge_repo
from src.repositories import map_repository as map_repo
from src.repositories import spawn_zone_repository as spawn_zone_repo
from src.schemas.challenge import ChallengeCreate, ChallengeRead, ChallengeUpdate
from src.utils.websocket_manager import websocket_manager

router = APIRouter(prefix="/challenges", tags=["challenges"])

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafio no encontrado",
        )

    return challenge

def _validate_map_and_spawn_zone(
    db: Session,
    map_id: int | None,
    spawn_zone_id: int | None,
) -> None:
    if map_id is not None and map_repo.get_map(db, map_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mapa no encontrado",
        )

    if spawn_zone_id is not None:
        spawn_zone = spawn_zone_repo.get_spawn_zone(db, spawn_zone_id)

        if spawn_zone is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Zona de spawn no encontrada",
            )

        if map_id is not None and spawn_zone.map_id != map_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La zona de spawn no pertenece al mapa indicado",
            )

@router.get("", response_model=list[ChallengeRead])
def list_challenges(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status_filter: ChallengeStatus | None = Query(default=None, alias="status"),
    map_id: int | None = None,
    spawn_zone_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[ChallengeRead]:
    return challenge_repo.list_challenges(
        db=db,
        skip=skip,
        limit=limit,
        status=status_filter,
        map_id=map_id,
        spawn_zone_id=spawn_zone_id,
    )

@router.get("/{challenge_id}", response_model=ChallengeRead)
def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    return _get_challenge_or_404(db, challenge_id)

@router.post("", response_model=ChallengeRead, status_code=status.HTTP_201_CREATED)
def create_challenge(
    challenge_data: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    _validate_map_and_spawn_zone(
        db=db,
        map_id=challenge_data.map_id,
        spawn_zone_id=challenge_data.spawn_zone_id,
    )

    return challenge_repo.create_challenge(db, challenge_data)

@router.patch("/{challenge_id}", response_model=ChallengeRead)
def update_challenge(
    challenge_id: int,
    challenge_data: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    challenge = _get_challenge_or_404(db, challenge_id)

    if challenge.status in (ChallengeStatus.completed, ChallengeStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede editar un desafio completado o cancelado",
        )

    map_id = challenge_data.map_id if challenge_data.map_id is not None else challenge.map_id
    spawn_zone_id = (
        challenge_data.spawn_zone_id
        if challenge_data.spawn_zone_id is not None
        else challenge.spawn_zone_id
    )

    _validate_map_and_spawn_zone(
        db=db,
        map_id=map_id,
        spawn_zone_id=spawn_zone_id,
    )

    return challenge_repo.update_challenge(db, challenge, challenge_data)

@router.post("/{challenge_id}/start", response_model=ChallengeRead)
async def start_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    challenge = _get_challenge_or_404(db, challenge_id)

    if challenge.status == ChallengeStatus.active:
        return challenge

    if challenge.status in (ChallengeStatus.completed, ChallengeStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede iniciar un desafio finalizado o cancelado",
        )

    active_players = player_repo.list_challenge_players(
        db=db,
        challenge_id=challenge.id,
        is_active=True,
    )

    if len(active_players) != challenge.player_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El desafio debe tener la cantidad de jugadores activos configurada",
        )

    unassigned_count = len([
        assignment
        for assignment in assignment_repo.list_assignments(db, challenge.id)
        if assignment.player_id is None
    ])

    if unassigned_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Todos los dinos deben estar asignados a un jugador",
        )

    for player in active_players:
        assignments_count = len(
            assignment_repo.list_assignments(
                db=db,
                challenge_id=challenge.id,
                player_id=player.id,
            )
        )

        if assignments_count < MIN_DINOS_PER_PLAYER or assignments_count > MAX_DINOS_PER_PLAYER:
            player_name = player.player.name if player.player else f"Jugador {player.position}"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{player_name} debe tener entre {MIN_DINOS_PER_PLAYER} y {MAX_DINOS_PER_PLAYER} dinos asignados",
            )

    challenge = challenge_repo.start_challenge(db, challenge)
    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge.id,
        event_type=ChallengeEventType.challenge_started,
        lives_after=challenge.current_lives,
        message="Desafio iniciado",
    )
    await websocket_manager.broadcast(challenge.id, {"type": "challenge_started", "challenge_id": challenge.id})
    return challenge

@router.post("/{challenge_id}/complete", response_model=ChallengeRead)
async def complete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    challenge = _get_challenge_or_404(db, challenge_id)

    if challenge.status == ChallengeStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede completar un desafio cancelado",
        )

    challenge = challenge_repo.complete_challenge(db, challenge)
    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge.id,
        event_type=ChallengeEventType.challenge_completed,
        lives_after=challenge.current_lives,
        message="Desafio completado",
    )
    await websocket_manager.broadcast(challenge.id, {"type": "challenge_completed", "challenge_id": challenge.id})
    return challenge

@router.post("/{challenge_id}/cancel", response_model=ChallengeRead)
async def cancel_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeRead:
    challenge = _get_challenge_or_404(db, challenge_id)

    if challenge.status == ChallengeStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar un desafio completado",
        )

    challenge = challenge_repo.cancel_challenge(db, challenge)
    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge.id,
        event_type=ChallengeEventType.challenge_cancelled,
        lives_after=challenge.current_lives,
        message="Desafio cancelado",
    )
    await websocket_manager.broadcast(challenge.id, {"type": "challenge_cancelled", "challenge_id": challenge.id})
    return challenge

@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    challenge = _get_challenge_or_404(db, challenge_id)
    challenge_repo.delete_challenge(db, challenge)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
