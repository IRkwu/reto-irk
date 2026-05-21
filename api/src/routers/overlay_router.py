from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.models.challenge_event import ChallengeEventType
from src.repositories import challenge_dino_assignment_repository as assignment_repo
from src.repositories import challenge_event_repository as event_repo
from src.repositories import challenge_repository as challenge_repo

router = APIRouter(prefix="/public", tags=["public overlay"])

def _get_challenge_or_404(db: Session, challenge_id: int):
    challenge = challenge_repo.get_challenge(db, challenge_id)

    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Desafio no encontrado",
        )

    return challenge

def _event_to_overlay_item(event) -> dict:
    return {
        "id_event": event.id,
        "event_type": event.event_type,
        "id_player": event.player_id,
        "player_name": event.player.player.name if event.player and event.player.player else None,
        "id_dino": event.dino_id,
        "dino_name": event.dino.name if event.dino else None,
        "lives_after": event.lives_after,
        "message": event.message,
        "created_at": event.created_at,
    }

@router.get("/challenges/{challenge_id}/overlay")
def get_public_overlay(
    challenge_id: int,
    recent_limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> dict:
    challenge = _get_challenge_or_404(db, challenge_id)
    assignments = assignment_repo.list_assignments(db, challenge_id)
    total_dinos = len(assignments)
    completed_dinos = len([assignment for assignment in assignments if assignment.is_tamed])
    recent_tame_events = event_repo.list_challenge_events(
        db=db,
        challenge_id=challenge_id,
        event_type=ChallengeEventType.dino_tamed,
        limit=recent_limit,
    )

    return jsonable_encoder(
        {
            "id_challenge": challenge.id,
            "challenge_name": challenge.name,
            "map": {
                "id_map": challenge.map.id if challenge.map else None,
                "name": challenge.map.name if challenge.map else None,
            },
            "spawn_zone": {
                "id_spawn_zone": challenge.spawn_zone.id if challenge.spawn_zone else None,
                "name": challenge.spawn_zone.name if challenge.spawn_zone else None,
            } if challenge.spawn_zone else None,
            "current_lives": challenge.current_lives,
            "initial_lives": total_dinos,
            "completed_dinos_count": completed_dinos,
            "total_dinos_count": total_dinos,
            "recent_tamed_dinos": [_event_to_overlay_item(event) for event in recent_tame_events],
        }
    )

@router.get("/challenges/{challenge_id}/events")
def get_public_overlay_events(
    challenge_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    _get_challenge_or_404(db, challenge_id)
    events = event_repo.list_challenge_events(db, challenge_id, limit=limit)
    return jsonable_encoder([_event_to_overlay_item(event) for event in events])
