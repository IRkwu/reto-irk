from sqlalchemy.orm import Session

from src.models.user import User

def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).one_or_none()

def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).one_or_none()

def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
) -> list[User]:
    query = db.query(User)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    return query.order_by(User.username.asc()).offset(skip).limit(limit).all()
