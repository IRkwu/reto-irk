import { apiRequest } from "./apiClient";

export const assignmentService = {
  list: (challengeId, query) =>
    apiRequest(`/challenges/${challengeId}/assignments`, {
      query,
    }),

  create: (challengeId, data) =>
    apiRequest(`/challenges/${challengeId}/assignments`, {
      method: "POST",
      body: data,
    }),

  update: (challengeId, assignmentId, data) =>
    apiRequest(`/challenges/${challengeId}/assignments/${assignmentId}`, {
      method: "PATCH",
      body: data,
    }),

  tame: (challengeId, assignmentId, playerId) =>
    apiRequest(`/challenges/${challengeId}/assignments/${assignmentId}/tame`, {
      method: "POST",
      body: playerId ? { player_id: playerId } : {},
    }),

  untame: (challengeId, assignmentId) =>
    apiRequest(`/challenges/${challengeId}/assignments/${assignmentId}/untame`,
      {
        method: "POST",
      }
    ),

  remove: (challengeId, assignmentId) =>
    apiRequest(`/challenges/${challengeId}/assignments/${assignmentId}`, {
      method: "DELETE",
    }),
};
