from sqlalchemy.orm import Session

from src.models.challenge_player import ChallengePlayer
from src.schemas.challenge_player import ChallengePlayerCreate, ChallengePlayerUpdate

def get_challenge_player(db: Session, player_id: int) -> ChallengePlayer | None:
    return db.query(ChallengePlayer).filter(ChallengePlayer.id == player_id).one_or_none()

def get_challenge_player_by_position(
    db: Session,
    challenge_id: int,
    position: int,
) -> ChallengePlayer | None:
    return (
        db.query(ChallengePlayer)
        .filter(
            ChallengePlayer.challenge_id == challenge_id,
            ChallengePlayer.position == position,
        )
        .one_or_none()
    )

def get_challenge_player_by_profile(
    db: Session,
    challenge_id: int,
    player_id: int,
) -> ChallengePlayer | None:
    return (
        db.query(ChallengePlayer)
        .filter(
            ChallengePlayer.challenge_id == challenge_id,
            ChallengePlayer.player_id == player_id,
        )
        .one_or_none()
    )

def get_challenge_player_by_spawn_zone(
    db: Session,
    challenge_id: int,
    spawn_zone_id: int,
) -> ChallengePlayer | None:
    return (
        db.query(ChallengePlayer)
        .filter(
            ChallengePlayer.challenge_id == challenge_id,
            ChallengePlayer.spawn_zone_id == spawn_zone_id,
        )
        .one_or_none()
    )

def list_challenge_players(
    db: Session,
    challenge_id: int,
    is_active: bool | None = None,
) -> list[ChallengePlayer]:
    query = db.query(ChallengePlayer).filter(ChallengePlayer.challenge_id == challenge_id)

    if is_active is not None:
        query = query.filter(ChallengePlayer.is_active == is_active)

    return query.order_by(ChallengePlayer.position.asc()).all()

def has_challenge_players_for_spawn_zone(db: Session, spawn_zone_id: int) -> bool:
    return (
        db.query(ChallengePlayer.id)
        .filter(ChallengePlayer.spawn_zone_id == spawn_zone_id)
        .first()
        is not None
    )

def create_challenge_player(
    db: Session,
    player_data: ChallengePlayerCreate,
) -> ChallengePlayer:
    player = ChallengePlayer(**player_data.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player

def update_challenge_player(
    db: Session,
    player: ChallengePlayer,
    player_data: ChallengePlayerUpdate,
) -> ChallengePlayer:
    update_data = player_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(player, field, value)

    db.commit()
    db.refresh(player)
    return player

def set_challenge_player_active(
    db: Session,
    player: ChallengePlayer,
    is_active: bool,
) -> ChallengePlayer:
    player.is_active = is_active
    db.commit()
    db.refresh(player)
    return player

def delete_challenge_player(db: Session, player: ChallengePlayer) -> None:
    db.delete(player)
    db.commit()
