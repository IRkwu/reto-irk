from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.models.challenge_event import ChallengeEvent, ChallengeEventType

def get_challenge_event(db: Session, event_id: int) -> ChallengeEvent | None:
    return db.query(ChallengeEvent).filter(ChallengeEvent.id == event_id).one_or_none()

def list_challenge_events(
    db: Session,
    challenge_id: int,
    skip: int = 0,
    limit: int = 100,
    event_type: ChallengeEventType | str | None = None,
    player_id: int | None = None,
    dino_id: int | None = None,
) -> list[ChallengeEvent]:
    query = db.query(ChallengeEvent).filter(ChallengeEvent.challenge_id == challenge_id)

    if event_type is not None:
        query = query.filter(ChallengeEvent.event_type == event_type)

    if player_id is not None:
        query = query.filter(ChallengeEvent.player_id == player_id)

    if dino_id is not None:
        query = query.filter(ChallengeEvent.dino_id == dino_id)

    return query.order_by(ChallengeEvent.created_at.desc(), ChallengeEvent.id.desc()).offset(skip).limit(limit).all()

def create_challenge_event(
    db: Session,
    challenge_id: int,
    event_type: ChallengeEventType | str,
    player_id: int | None = None,
    dino_id: int | None = None,
    lives_after: int | None = None,
    message: str | None = None,
) -> ChallengeEvent:
    event = ChallengeEvent(
        challenge_id=challenge_id,
        event_type=event_type,
        player_id=player_id,
        dino_id=dino_id,
        lives_after=lives_after,
        message=message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def delete_challenge_event(db: Session, event: ChallengeEvent) -> None:
    db.delete(event)
    db.commit()
