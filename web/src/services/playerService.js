import { apiRequest } from "./apiClient";

export const playerService = {
  list: (query) =>
    apiRequest("/players", {
      query,
    }),

  get: (playerId) => apiRequest(`/players/${playerId}`),

  getStats: (playerId) => apiRequest(`/players/${playerId}/stats`),

  create: (data) =>
    apiRequest("/players", {
      method: "POST",
      body: data,
    }),

  update: (playerId, data) =>
    apiRequest(`/players/${playerId}`, {
      method: "PATCH",
      body: data,
    }),

  activate: (playerId) =>
    apiRequest(`/players/${playerId}/activate`, {
      method: "PATCH",
    }),

  deactivate: (playerId) =>
    apiRequest(`/players/${playerId}/deactivate`, {
      method: "PATCH",
    }),

  remove: (playerId) =>
    apiRequest(`/players/${playerId}`, {
      method: "DELETE",
    }),
};
