from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.database.base import Base
from src.database.session import engine
from src.routers import auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Reto IRK API", version="0.1.0", debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
