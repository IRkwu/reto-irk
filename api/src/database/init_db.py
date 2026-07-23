from src.database.base import Base
from src.database.session import engine


def init_db() -> None:
    import src.models

    Base.metadata.create_all(bind=engine)
