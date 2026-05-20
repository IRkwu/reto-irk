DEFAULT_PLAYER_COUNT = 1
MIN_PLAYERS_PER_CHALLENGE = 1
MAX_PLAYERS_PER_CHALLENGE = 4

DEFAULT_BASE_LIVES_PER_PLAYER = 10
MIN_BASE_LIVES_PER_PLAYER = 1

MIN_DINOS_PER_PLAYER = 5
MAX_DINOS_PER_PLAYER = 20


def calculate_initial_lives(player_count: int, base_lives_per_player: int) -> int:
    return player_count * base_lives_per_player
