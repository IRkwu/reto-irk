import { apiRequest } from "./apiClient";

export const overlayService = {
  getOverlay: (challengeId, query) =>
    apiRequest(`/public/challenges/${challengeId}/overlay`, {
      query,
      skipAuth: true,
    }),

  listEvents: (challengeId, query) =>
    apiRequest(`/public/challenges/${challengeId}/events`, {
      query,
      skipAuth: true,
    }),
};
