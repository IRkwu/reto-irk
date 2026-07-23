DEFAULT_PLAYER_COUNT = 1
MIN_PLAYERS_PER_CHALLENGE = 1
MAX_PLAYERS_PER_CHALLENGE = 4

MIN_DINOS_PER_PLAYER = 1
MAX_DINOS_PER_PLAYER = 20

EVOLVED_GAME = "ark_survival_evolved"
ASCENDED_GAME = "ark_survival_ascended"


def calculate_initial_lives(total_dinos: int) -> int:
    return total_dinos


def dino_is_available_for_game(challenge_game: str, dino_game: str) -> bool:
    if challenge_game == EVOLVED_GAME:
        return dino_game == EVOLVED_GAME

    return challenge_game == ASCENDED_GAME and dino_game in {EVOLVED_GAME, ASCENDED_GAME}
