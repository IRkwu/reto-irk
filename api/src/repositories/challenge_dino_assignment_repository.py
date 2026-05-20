from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.models.challenge_dino_assignment import ChallengeDinoAssignment
from src.schemas.challenge_dino_assignment import ChallengeDinoAssignmentCreate, ChallengeDinoAssignmentUpdate

def get_assignment(db: Session, assignment_id: int) -> ChallengeDinoAssignment | None:
    return (
        db.query(ChallengeDinoAssignment)
        .filter(ChallengeDinoAssignment.id == assignment_id)
        .one_or_none()
    )

def get_assignment_by_dino(
    db: Session,
    challenge_id: int,
    dino_id: int,
) -> ChallengeDinoAssignment | None:
    return (
        db.query(ChallengeDinoAssignment)
        .filter(
            ChallengeDinoAssignment.challenge_id == challenge_id,
            ChallengeDinoAssignment.dino_id == dino_id,
        )
        .one_or_none()
    )

def list_assignments(
    db: Session,
    challenge_id: int,
    player_id: int | None = None,
    dino_id: int | None = None,
    is_tamed: bool | None = None,
) -> list[ChallengeDinoAssignment]:
    query = db.query(ChallengeDinoAssignment).filter(ChallengeDinoAssignment.challenge_id == challenge_id)

    if player_id is not None:
        query = query.filter(ChallengeDinoAssignment.player_id == player_id)

    if dino_id is not None:
        query = query.filter(ChallengeDinoAssignment.dino_id == dino_id)

    if is_tamed is not None:
        query = query.filter(ChallengeDinoAssignment.is_tamed == is_tamed)

    return query.order_by(ChallengeDinoAssignment.id.asc()).all()

def create_assignment(
    db: Session,
    assignment_data: ChallengeDinoAssignmentCreate,
) -> ChallengeDinoAssignment:
    assignment = ChallengeDinoAssignment(**assignment_data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

def update_assignment(
    db: Session,
    assignment: ChallengeDinoAssignment,
    assignment_data: ChallengeDinoAssignmentUpdate,
) -> ChallengeDinoAssignment:
    update_data = assignment_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(assignment, field, value)

    db.commit()
    db.refresh(assignment)
    return assignment

def mark_assignment_tamed(
    db: Session,
    assignment: ChallengeDinoAssignment,
    player_id: int | None,
) -> ChallengeDinoAssignment:
    assignment.is_tamed = True
    assignment.tamed_by_player_id = player_id
    assignment.tamed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assignment)
    return assignment

def mark_assignment_untamed(
    db: Session,
    assignment: ChallengeDinoAssignment,
) -> ChallengeDinoAssignment:
    assignment.is_tamed = False
    assignment.tamed_by_player_id = None
    assignment.tamed_at = None
    db.commit()
    db.refresh(assignment)
    return assignment

def delete_assignment(db: Session, assignment: ChallengeDinoAssignment) -> None:
    db.delete(assignment)
    db.commit()

def delete_assignments_for_player(
    db: Session,
    challenge_id: int,
    player_id: int,
) -> int:
    assignments = (
        db.query(ChallengeDinoAssignment)
        .filter(
            ChallengeDinoAssignment.challenge_id == challenge_id,
            ChallengeDinoAssignment.player_id == player_id,
        )
        .all()
    )

    deleted_count = len(assignments)

    for assignment in assignments:
        db.delete(assignment)

    (
        db.query(ChallengeDinoAssignment)
        .filter(
            ChallengeDinoAssignment.challenge_id == challenge_id,
            ChallengeDinoAssignment.tamed_by_player_id == player_id,
        )
        .update(
            {
                ChallengeDinoAssignment.tamed_by_player_id: None,
                ChallengeDinoAssignment.tamed_at: None,
            },
            synchronize_session=False,
        )
    )

    db.commit()
    return deleted_count
