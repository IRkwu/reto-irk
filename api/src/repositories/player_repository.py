from sqlalchemy.orm import Session

from src.models.challenge import Challenge, ChallengeStatus
from src.models.challenge_dino_assignment import ChallengeDinoAssignment
from src.models.challenge_player import ChallengePlayer
from src.models.player import Player
from src.schemas.player import PlayerCreate, PlayerUpdate

def get_player(db: Session, player_id: int) -> Player | None:
    return db.query(Player).filter(Player.id == player_id).one_or_none()

def get_player_by_name(db: Session, name: str) -> Player | None:
    return db.query(Player).filter(Player.name == name).one_or_none()

def list_players(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    name: str | None = None,
    is_active: bool | None = None,
) -> list[Player]:
    query = db.query(Player)

    if name:
        query = query.filter(Player.name.ilike(f"%{name}%"))

    if is_active is not None:
        query = query.filter(Player.is_active == is_active)

    return query.order_by(Player.name.asc()).offset(skip).limit(limit).all()

def create_player(db: Session, player_data: PlayerCreate) -> Player:
    player = Player(**player_data.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player

def update_player(db: Session, player: Player, player_data: PlayerUpdate) -> Player:
    update_data = player_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(player, field, value)

    db.commit()
    db.refresh(player)
    return player

def set_player_active(db: Session, player: Player, is_active: bool) -> Player:
    player.is_active = is_active
    db.commit()
    db.refresh(player)
    return player

def delete_player(db: Session, player: Player) -> None:
    db.delete(player)
    db.commit()

def player_has_participations(db: Session, player_id: int) -> bool:
    return (
        db.query(ChallengePlayer)
        .filter(ChallengePlayer.player_id == player_id)
        .first()
        is not None
    )

def get_player_stats(db: Session, player: Player) -> dict:
    participations = (
        db.query(ChallengePlayer)
        .filter(ChallengePlayer.player_id == player.id)
        .all()
    )
    participation_ids = [participation.id for participation in participations]
    challenge_ids = list({participation.challenge_id for participation in participations})

    challenges_completed = 0
    dinos_tamed = 0
    dinos_not_tamed = 0

    if challenge_ids:
        challenges_completed = (
            db.query(Challenge)
            .filter(
                Challenge.id.in_(challenge_ids),
                Challenge.status == ChallengeStatus.completed,
            )
            .count()
        )

    if participation_ids:
        dinos_tamed = (
            db.query(ChallengeDinoAssignment)
            .filter(
                ChallengeDinoAssignment.player_id.in_(participation_ids),
                ChallengeDinoAssignment.is_tamed == True,
            )
            .count()
        )
        dinos_not_tamed = (
            db.query(ChallengeDinoAssignment)
            .filter(
                ChallengeDinoAssignment.player_id.in_(participation_ids),
                ChallengeDinoAssignment.is_tamed == False,
            )
            .count()
        )

    total_dinos = dinos_tamed + dinos_not_tamed
    tamed_percentage = round((dinos_tamed / total_dinos) * 100, 2) if total_dinos else 0.0
    not_tamed_percentage = round((dinos_not_tamed / total_dinos) * 100, 2) if total_dinos else 0.0

    return {
        "id": player.id,
        "name": player.name,
        "icon_url": player.icon_url,
        "is_active": player.is_active,
        "challenges_participated": len(challenge_ids),
        "challenges_completed": challenges_completed,
        "dinos_tamed": dinos_tamed,
        "dinos_not_tamed": dinos_not_tamed,
        "dinos_tamed_percentage": tamed_percentage,
        "dinos_not_tamed_percentage": not_tamed_percentage,
    }
