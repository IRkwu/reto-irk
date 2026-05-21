import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.challenge_rules import MAX_DINOS_PER_PLAYER
from src.core.security import get_current_admin
from src.database.session import get_db
from src.models.challenge import ChallengeStatus
from src.repositories import challenge_dino_assignment_repository as assignment_repo
from src.repositories import challenge_player_repository as player_repo
from src.repositories import challenge_repository as challenge_repo
from src.repositories import dino_map_repository as dino_map_repo
from src.repositories import dino_repository as dino_repo
from src.schemas.challenge_dino_assignment import ChallengeDinoAssignmentCreate
from src.schemas.dino import DinoRead
from src.schemas.roulette import RouletteAssignBody, RouletteAssignRead, RouletteRollRead
from src.utils.websocket_manager import websocket_manager

router = APIRouter(prefix="/challenges/{challenge_id}", tags=["roulette"])

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafio no encontrado",
        )

    return challenge

def _ensure_editable_challenge(challenge) -> None:
    if challenge.status not in (ChallengeStatus.draft, ChallengeStatus.active):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La ruleta solo se puede usar mientras el desafio esta en borrador o activo",
        )

def _available_dinos(db: Session, challenge_id: int) -> list:
    challenge = _get_challenge_or_404(db, challenge_id)
    assigned_dino_ids = {
        assignment.dino_id
        for assignment in assignment_repo.list_assignments(db, challenge_id)
    }
    dino_maps = dino_map_repo.list_dino_maps(
        db=db,
        map_id=challenge.map_id,
        is_active=True,
        limit=1000,
    )
    dinos = [
        dino_map.dino
        for dino_map in dino_maps
        if dino_map.dino.is_active and dino_map.dino_id not in assigned_dino_ids
    ]

    return sorted(dinos, key=lambda dino: dino.name)

@router.get("/roulette/dinos", response_model=list[DinoRead])
def list_roulette_dinos(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> list[DinoRead]:
    return _available_dinos(db, challenge_id)

@router.post("/roulette/roll", response_model=RouletteRollRead)
def roll_roulette_dino(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> RouletteRollRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_editable_challenge(challenge)
    dinos = _available_dinos(db, challenge_id)

    if not dinos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay dinos disponibles para la ruleta",
        )

    return RouletteRollRead(dino=random.choice(dinos))

@router.post("/assignments/from-roulette", response_model=RouletteAssignRead, status_code=status.HTTP_201_CREATED)
async def create_assignment_from_roulette(
    challenge_id: int,
    roulette_data: RouletteAssignBody,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin),
) -> RouletteAssignRead:
    challenge = _get_challenge_or_404(db, challenge_id)
    _ensure_editable_challenge(challenge)

    player_assignments = assignment_repo.list_assignments(
        db=db,
        challenge_id=challenge_id,
        player_id=roulette_data.player_id,
    )

    if len(player_assignments) >= MAX_DINOS_PER_PLAYER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un jugador no puede tener mas de 20 dinos asignados",
        )

    player = player_repo.get_challenge_player(db, roulette_data.player_id)

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

    dino = dino_repo.get_dino(db, roulette_data.dino_id)
    dino_map = dino_map_repo.get_dino_map_by_pair(
        db=db,
        dino_id=roulette_data.dino_id,
        map_id=challenge.map_id,
    )

    if dino is None or not dino.is_active or dino_map is None or not dino_map.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El dino no esta disponible para el mapa del desafio",
        )

    if assignment_repo.get_assignment_by_dino(
        db=db,
        challenge_id=challenge_id,
        dino_id=roulette_data.dino_id,
    ) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El dino ya esta asignado en este desafio",
        )

    assignment = assignment_repo.create_assignment(
        db=db,
        assignment_data=ChallengeDinoAssignmentCreate(
            challenge_id=challenge_id,
            player_id=roulette_data.player_id,
            dino_id=roulette_data.dino_id,
        ),
    )
    challenge_repo.sync_draft_lives_with_assignments(db, challenge)
    await websocket_manager.broadcast(challenge_id, {"type": "assignment_created", "challenge_id": challenge_id})
    return RouletteAssignRead(assignment=assignment)
