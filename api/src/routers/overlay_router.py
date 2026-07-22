from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from src.database.session import get_db
from src.models.challenge_event import ChallengeEventType
from src.repositories import challenge_dino_assignment_repository as assignment_repo
from src.repositories import challenge_event_repository as event_repo
from src.repositories import challenge_player_repository as challenge_player_repo
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

def _get_event_player(event):
    if event.player:
        return event.player

    if event.dino_id is None or not event.challenge:
        return None

    assignment = next(
        (
            item
            for item in event.challenge.assignments
            if item.dino_id == event.dino_id
        ),
        None,
    )

    if assignment is None:
        return None

    return assignment.tamed_by_player or assignment.player

def _event_to_overlay_item(event) -> dict:
    player = _get_event_player(event)

    return {
        "id_event": event.id,
        "event_type": event.event_type,
        "id_player": player.id if player else event.player_id,
        "player_name": player.player.name if player and player.player else None,
        "id_dino": event.dino_id,
        "dino_name": event.dino.name if event.dino else None,
        "dino_image_url": event.dino.image_url if event.dino else None,
        "lives_after": event.lives_after,
        "message": event.message,
        "created_at": event.created_at,
    }

def _challenge_player_to_overlay_item(challenge_player) -> dict:
    player = challenge_player.player

    return {
        "id_player": player.id if player else challenge_player.player_id,
        "player_name": player.name if player else None,
        "player_icon_url": player.icon_url if player else None,
    }

@router.get("/challenges/{challenge_id}/overlay")
def get_public_overlay(
    challenge_id: int,
    recent_limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> dict:
    challenge = _get_challenge_or_404(db, challenge_id)
    assignments = assignment_repo.list_assignments(db, challenge_id)
    players = challenge_player_repo.list_challenge_players(db, challenge_id, is_active=True)
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
            "players": [_challenge_player_to_overlay_item(player) for player in players],
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
