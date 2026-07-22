import { apiRequest } from "./apiClient";

export const gameplayService = {
  increaseLives: (challengeId, data = {}) =>
    apiRequest(`/challenges/${challengeId}/lives/increase`, {
      method: "POST",
      body: data,
    }),

  decreaseLives: (challengeId, data = {}) =>
    apiRequest(`/challenges/${challengeId}/lives/decrease`, {
      method: "POST",
      body: data,
    }),

  listEvents: (challengeId, query) =>
    apiRequest(`/challenges/${challengeId}/events`, {
      query,
    }),

  createEvent: (challengeId, data) =>
    apiRequest(`/challenges/${challengeId}/events`, {
      method: "POST",
      body: data,
    }),
};
