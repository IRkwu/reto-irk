from src.schemas.auth import CurrentUser, Token
from src.schemas.challenge import ChallengeCreate, ChallengeRead, ChallengeUpdate
from src.schemas.challenge_dino_assignment import (
    ChallengeDinoAssignmentCreate,
    ChallengeDinoAssignmentRead,
    ChallengeDinoAssignmentUpdate,
)
from src.schemas.challenge_event import ChallengeEventRead
from src.schemas.challenge_player import ChallengePlayerCreate, ChallengePlayerRead, ChallengePlayerUpdate
from src.schemas.dino import DinoCreate, DinoRead, DinoUpdate
from src.schemas.dino_map import DinoMapCreate, DinoMapRead
from src.schemas.map import MapCreate, MapRead, MapUpdate
from src.schemas.player import PlayerCreate, PlayerRead, PlayerStatsRead, PlayerUpdate
from src.schemas.spawn_zone import SpawnZoneCreate, SpawnZoneRead, SpawnZoneUpdate
from src.schemas.user import UserRead

__all__ = [
    "ChallengeCreate",
    "ChallengeDinoAssignmentCreate",
    "ChallengeDinoAssignmentRead",
    "ChallengeDinoAssignmentUpdate",
    "ChallengeEventRead",
    "ChallengePlayerCreate",
    "ChallengePlayerRead",
    "ChallengePlayerUpdate",
    "ChallengeRead",
    "ChallengeUpdate",
    "CurrentUser",
    "DinoCreate",
    "DinoMapCreate",
    "DinoMapRead",
    "DinoRead",
    "DinoUpdate",
    "MapCreate",
    "MapRead",
    "MapUpdate",
    "PlayerCreate",
    "PlayerRead",
    "PlayerStatsRead",
    "PlayerUpdate",
    "SpawnZoneCreate",
    "SpawnZoneRead",
    "SpawnZoneUpdate",
    "Token",
    "UserRead",
]
