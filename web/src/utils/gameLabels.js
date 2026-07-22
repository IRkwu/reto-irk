export const GAME_LABELS = {
  ark_survival_evolved: "Evolved",
  ark_survival_ascended: "Ascended",
};

export const GAME_FULL_LABELS = {
  ark_survival_evolved: "Ark Survival Evolved",
  ark_survival_ascended: "Ark Survival Ascended",
};

export function getGameLabel(gameId, fallback = "Juego") {
  return GAME_LABELS[gameId] || fallback;
}
