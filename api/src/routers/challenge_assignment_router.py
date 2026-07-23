from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.core.challenge_rules import MAX_DINOS_PER_PLAYER, dino_is_available_for_game
from src.core.security import get_current_admin
from src.database.session import get_db
from src.models.challenge import ChallengeStatus
from src.models.challenge_event import ChallengeEventType
from src.repositories import challenge_dino_assignment_repository as assignment_repo
from src.repositories import challenge_event_repository as event_repo
from src.repositories import challenge_player_repository as player_repo
from src.repositories import challenge_repository as challenge_repo
from src.repositories import dino_map_repository as dino_map_repo
from src.repositories import dino_repository as dino_repo
from src.schemas.challenge_dino_assignment import ChallengeDinoAssignmentCreate, ChallengeDinoAssignmentRead, ChallengeDinoAssignmentUpdate
from src.utils.websocket_manager import websocket_manager

router = APIRouter(prefix="/challenges/{challenge_id}/assignments", tags=["challenge assignments"])

class ChallengeDinoAssignmentBody(BaseModel):
    player_id: int
    dino_id: int
    is_tamed: bool = False

class TameAssignmentBody(BaseModel):
    player_id: int | None = None

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafio no encontrado",
        )

    return challenge

def _get_assignment_or_404(db: Session, challenge_id: int, assignment_id: int):
    assignment = assignment_repo.get_assignment(db, assignment_id)

    if assignment is None or assignment.challenge_id != challenge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignacion no encontrada en este desafio",
        )

    return assignment

def _ensure_editable_challenge(challenge) -> None:
    if challenge.status not in (ChallengeStatus.draft, ChallengeStatus.active):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden editar asignaciones mientras el desafio esta en borrador o activo",
        )

def _ensure_active_challenge(challenge) -> None:
    if challenge.status != ChallengeStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden actualizar dinos mientras el desafio esta activo",
        )

def _ensure_assignment_not_completed(assignment) -> None:
    if assignment.is_tamed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede editar un dino completado",
        )

def _validate_player_and_dino(db: Session, challenge_id: int, player_id: int | None, dino_id: int) -> None:
    if player_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cada dino debe estar asignado a un jugador del desafio",
        )

    player = player_repo.get_challenge_player(db, player_id)

    if player is None or player.challenge_id != challenge_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jugador no encontrado en este desafio",
        )

    if not player.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden asignar dinos a un jugador inactivo",
        )

    if dino_repo.get_dino(db, dino_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

def _ensure_dino_available(
    db: Session,
    challenge_id: int,
    dino_id: int,
    current_assignment_id: int | None = None,
) -> None:
    existing_assignment = assignment_repo.get_assignment_by_dino(
        db=db,
        challenge_id=challenge_id,
        dino_id=dino_id,
    )

    if existing_assignment is not None and existing_assignment.id != current_assignment_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El dino ya esta asignado en este desafio",
        )

def _ensure_dino_allowed_for_challenge(db: Session, challenge, dino_id: int) -> None:
    dino = dino_repo.get_dino(db, dino_id)

    if dino is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dino no encontrado",
        )

    dino_map = dino_map_repo.get_dino_map_by_pair(
        db=db,
        dino_id=dino_id,
        map_id=challenge.map_id,
    )

    if not dino.is_active or dino_map is None or not dino_map.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El dino no esta disponible para el mapa del desafio",
        )

    if not dino_is_available_for_game(challenge.game, dino.game):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El dino no esta disponible para el juego del desafio",
        )

async def _complete_challenge_if_ready(db: Session, challenge_id: int) -> None:
    challenge = challenge_repo.get_challenge(db, challenge_id)
    assignments = assignment_repo.list_assignments(db, challenge_id)

    if not challenge or not assignments:
        return

    if challenge.status != ChallengeStatus.completed and all(assignment.is_tamed for assignment in assignments):
        challenge = challenge_repo.complete_challenge(db, challenge)
        event_repo.create_challenge_event(
            db=db,
            challenge_id=challenge_id,
            event_type=ChallengeEventType.challenge_completed,
            lives_after=challenge.current_lives,
            message="Desafio completado",
        )
        await websocket_manager.broadcast(challenge_id, {"type": "challenge_completed", "challenge_id": challenge_id})

@router.get("", response_model=list[ChallengeDinoAssignmentRead])
def list_assignments(
    challenge_id: int,
    player_id: int | None = None,
    dino_id: int | None = None,
    is_tamed: bool | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[ChallengeDinoAssignmentRead]:
    _get_challenge_or_404(db, challenge_id)
    return assignment_repo.list_assignments(
        db=db,
        challenge_id=challenge_id,
        player_id=player_id,
        dino_id=dino_id,
        is_tamed=is_tamed,
    )

@router.post("", response_model=ChallengeDinoAssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    challenge_id: int,
    assignment_data: ChallengeDinoAssignmentBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeDinoAssignmentRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_editable_challenge(challenge)

    player_assignments = assignment_repo.list_assignments(
        db=db,
        challenge_id=challenge_id,
        player_id=assignment_data.player_id,
    )

    if len(player_assignments) >= MAX_DINOS_PER_PLAYER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un jugador no puede tener mas de 20 dinos asignados",
        )

    _validate_player_and_dino(
        db=db,
        challenge_id=challenge_id,
        player_id=assignment_data.player_id,
        dino_id=assignment_data.dino_id,
    )
    _ensure_dino_allowed_for_challenge(db, challenge, assignment_data.dino_id)
    _ensure_dino_available(
        db=db,
        challenge_id=challenge_id,
        dino_id=assignment_data.dino_id,
    )

    assignment = assignment_repo.create_assignment(
        db=db,
        assignment_data=ChallengeDinoAssignmentCreate(
            challenge_id=challenge_id,
            **assignment_data.model_dump(),
        ),
    )
    challenge_repo.sync_draft_lives_with_assignments(db, challenge)
    await websocket_manager.broadcast(challenge_id, {"type": "assignment_created", "challenge_id": challenge_id})
    return assignment

@router.patch("/{assignment_id}", response_model=ChallengeDinoAssignmentRead)
async def update_assignment(
    challenge_id: int,
    assignment_id: int,
    assignment_data: ChallengeDinoAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeDinoAssignmentRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_editable_challenge(challenge)
    assignment = _get_assignment_or_404(db, challenge_id, assignment_id)
    _ensure_assignment_not_completed(assignment)

    if "player_id" in assignment_data.model_fields_set and assignment_data.player_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cada dino debe estar asignado a un jugador del desafio",
        )

    player_id = assignment_data.player_id if assignment_data.player_id is not None else assignment.player_id
    dino_id = assignment_data.dino_id if assignment_data.dino_id is not None else assignment.dino_id
    _validate_player_and_dino(db, challenge_id, player_id, dino_id)
    _ensure_dino_allowed_for_challenge(db, challenge, dino_id)
    _ensure_dino_available(
        db=db,
        challenge_id=challenge_id,
        dino_id=dino_id,
        current_assignment_id=assignment.id,
    )

    if player_id != assignment.player_id:
        player_assignments = assignment_repo.list_assignments(
            db=db,
            challenge_id=challenge_id,
            player_id=player_id,
        )

        if len(player_assignments) >= MAX_DINOS_PER_PLAYER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un jugador no puede tener mas de 20 dinos asignados",
            )

    if assignment_data.tamed_by_player_id is not None:
        player = player_repo.get_challenge_player(db, assignment_data.tamed_by_player_id)

        if player is None or player.challenge_id != challenge_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jugador que tameo no encontrado en este desafio",
            )

    assignment = assignment_repo.update_assignment(db, assignment, assignment_data)
    await websocket_manager.broadcast(challenge_id, {"type": "assignment_updated", "challenge_id": challenge_id})
    return assignment

@router.post("/{assignment_id}/tame", response_model=ChallengeDinoAssignmentRead)
async def mark_assignment_tamed(
    challenge_id: int,
    assignment_id: int,
    tame_data: TameAssignmentBody | None = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeDinoAssignmentRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_active_challenge(challenge)
    assignment = _get_assignment_or_404(db, challenge_id, assignment_id)
    _ensure_assignment_not_completed(assignment)
    was_tamed = assignment.is_tamed
    tamed_by_player_id = tame_data.player_id if tame_data and tame_data.player_id is not None else assignment.player_id

    if tamed_by_player_id is not None:
        player = player_repo.get_challenge_player(db, tamed_by_player_id)

        if player is None or player.challenge_id != challenge_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jugador no encontrado en este desafio",
            )

    assignment = assignment_repo.mark_assignment_tamed(db, assignment, tamed_by_player_id)

    if not was_tamed:
        challenge = challenge_repo.increase_challenge_lives(db, challenge, 1)

    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge_id,
        event_type=ChallengeEventType.dino_tamed,
        player_id=tamed_by_player_id,
        dino_id=assignment.dino_id,
        lives_after=challenge.current_lives,
        message="Dino tameado",
    )
    await websocket_manager.broadcast(challenge_id, {"type": "dino_tamed", "challenge_id": challenge_id, "current_lives": challenge.current_lives})
    await _complete_challenge_if_ready(db, challenge_id)
    return assignment

@router.post("/{assignment_id}/untame", response_model=ChallengeDinoAssignmentRead)
async def mark_assignment_untamed(
    challenge_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> ChallengeDinoAssignmentRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_active_challenge(challenge)
    assignment = _get_assignment_or_404(db, challenge_id, assignment_id)
    was_tamed = assignment.is_tamed
    dino_id = assignment.dino_id
    player_id = assignment.tamed_by_player_id or assignment.player_id
    assignment = assignment_repo.mark_assignment_untamed(db, assignment)

    if was_tamed:
        challenge = challenge_repo.decrease_challenge_lives(db, challenge, 1)

    event_repo.create_challenge_event(
        db=db,
        challenge_id=challenge_id,
        event_type=ChallengeEventType.dino_untamed,
        player_id=player_id,
        dino_id=dino_id,
        lives_after=challenge.current_lives,
        message="Dino marcado como no tameado",
    )
    await websocket_manager.broadcast(challenge_id, {"type": "dino_untamed", "challenge_id": challenge_id, "current_lives": challenge.current_lives})
    return assignment

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    challenge_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> Response:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_editable_challenge(challenge)
    assignment = _get_assignment_or_404(db, challenge_id, assignment_id)
    _ensure_assignment_not_completed(assignment)
    assignment_repo.delete_assignment(db, assignment)
    challenge_repo.sync_draft_lives_with_assignments(db, challenge)
    await websocket_manager.broadcast(challenge_id, {"type": "assignment_deleted", "challenge_id": challenge_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
