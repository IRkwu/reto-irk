import { apiRequest } from "./apiClient";

export const challengeService = {
  list: (query) =>
    apiRequest("/challenges", {
      query,
    }),

  get: (challengeId) => apiRequest(`/challenges/${challengeId}`),

  create: (data) =>
    apiRequest("/challenges", {
      method: "POST",
      body: data,
    }),

  update: (challengeId, data) =>
    apiRequest(`/challenges/${challengeId}`, {
      method: "PATCH",
      body: data,
    }),

  start: (challengeId) =>
    apiRequest(`/challenges/${challengeId}/start`, {
      method: "POST",
    }),

  complete: (challengeId) =>
    apiRequest(`/challenges/${challengeId}/complete`, {
      method: "POST",
    }),

  cancel: (challengeId) =>
    apiRequest(`/challenges/${challengeId}/cancel`, {
      method: "POST",
    }),

  remove: (challengeId) =>
    apiRequest(`/challenges/${challengeId}`, {
      method: "DELETE",
    }),
};

export const challengePlayerService = {
  list: (challengeId) => apiRequest(`/challenges/${challengeId}/players`),

  create: (challengeId, data) =>
    apiRequest(`/challenges/${challengeId}/players`, {
      method: "POST",
      body: { challenge_id: Number(challengeId), ...data },
    }),

  update: (challengeId, challengePlayerId, data) =>
    apiRequest(`/challenges/${challengeId}/players/${challengePlayerId}`, {
      method: "PATCH",
      body: data,
    }),

  setActive: (challengeId, challengePlayerId, isActive) =>
    apiRequest(`/challenges/${challengeId}/players/${challengePlayerId}/active`,
      {
        method: "PATCH",
        body: { is_active: isActive },
      }
    ),

  remove: (challengeId, challengePlayerId) =>
    apiRequest(`/challenges/${challengeId}/players/${challengePlayerId}`, {
      method: "DELETE",
    }),
};
