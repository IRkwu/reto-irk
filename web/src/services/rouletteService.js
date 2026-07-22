import { apiRequest } from "./apiClient";

export const rouletteService = {
  listDinos: (challengeId) =>
    apiRequest(`/challenges/${challengeId}/roulette/dinos`),

  roll: (challengeId) =>
    apiRequest(`/challenges/${challengeId}/roulette/roll`, {
      method: "POST",
    }),

  assign: (challengeId, data) =>
    apiRequest(`/challenges/${challengeId}/assignments/from-roulette`, {
      method: "POST",
      body: data,
    }),
};
