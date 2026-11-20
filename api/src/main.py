from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.database.init_db import init_db
from src.routers import (
    auth_router,
    challenge_assignment_router,
    challenge_player_router,
    challenge_router,
    dino_router,
    gameplay_router,
    map_router,
    overlay_router,
    player_router,
    roulette_router,
    spawn_zone_router,
    websocket_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="ARK Challenge API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(dino_router.router)
app.include_router(map_router.router)
app.include_router(spawn_zone_router.router)
app.include_router(player_router.router)
app.include_router(challenge_router.router)
app.include_router(challenge_player_router.router)
app.include_router(roulette_router.router)
app.include_router(challenge_assignment_router.router)
app.include_router(gameplay_router.router)
app.include_router(overlay_router.router)
app.include_router(websocket_router.router)
