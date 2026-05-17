from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.models.challenge import Challenge, ChallengeStatus
from src.schemas.challenge import ChallengeCreate, ChallengeUpdate

def get_challenge(db: Session, challenge_id: int) -> Challenge | None:
    return db.query(Challenge).filter(Challenge.id == challenge_id).one_or_none()

def list_challenges(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: ChallengeStatus | str | None = None,
    map_id: int | None = None,
    spawn_zone_id: int | None = None,
) -> list[Challenge]:
    query = db.query(Challenge)

    if status is not None:
        query = query.filter(Challenge.status == status)

    if map_id is not None:
        query = query.filter(Challenge.map_id == map_id)

    if spawn_zone_id is not None:
        query = query.filter(Challenge.spawn_zone_id == spawn_zone_id)

    return query.order_by(Challenge.created_at.desc()).offset(skip).limit(limit).all()

def create_challenge(db: Session, challenge_data: ChallengeCreate) -> Challenge:
    data = challenge_data.model_dump()
    data["current_lives"] = data["player_count"] * data["base_lives_per_player"]

    challenge = Challenge(**data)
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge

def update_challenge(db: Session, challenge: Challenge, challenge_data: ChallengeUpdate) -> Challenge:
    update_data = challenge_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(challenge, field, value)

    db.commit()
    db.refresh(challenge)
    return challenge

def start_challenge(db: Session, challenge: Challenge) -> Challenge:
    challenge.status = ChallengeStatus.active
    challenge.started_at = datetime.now(timezone.utc)
    challenge.current_lives = challenge.player_count * challenge.base_lives_per_player

    db.commit()
    db.refresh(challenge)
    return challenge

def complete_challenge(db: Session, challenge: Challenge) -> Challenge:
    challenge.status = ChallengeStatus.completed
    challenge.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(challenge)
    return challenge

def cancel_challenge(db: Session, challenge: Challenge) -> Challenge:
    challenge.status = ChallengeStatus.cancelled
    challenge.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(challenge)
    return challenge

def set_challenge_lives(db: Session, challenge: Challenge, lives: int) -> Challenge:
    challenge.current_lives = max(lives, 0)
    db.commit()
    db.refresh(challenge)
    return challenge

def increase_challenge_lives(db: Session, challenge: Challenge, amount: int = 1) -> Challenge:
    challenge.current_lives += amount
    db.commit()
    db.refresh(challenge)
    return challenge

def decrease_challenge_lives(db: Session, challenge: Challenge, amount: int = 1) -> Challenge:
    challenge.current_lives = max(challenge.current_lives - amount, 0)
    db.commit()
    db.refresh(challenge)
    return challenge

def delete_challenge(db: Session, challenge: Challenge) -> None:
    db.delete(challenge)
    db.commit()
