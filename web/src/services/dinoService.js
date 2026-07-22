import { apiRequest } from "./apiClient";

export const dinoService = {
  list: (query) =>
    apiRequest("/dinos", {
      query,
    }),

  get: (dinoId) => apiRequest(`/dinos/${dinoId}`),

  create: (data) =>
    apiRequest("/dinos", {
      method: "POST",
      body: data,
    }),

  update: (dinoId, data) =>
    apiRequest(`/dinos/${dinoId}`, {
      method: "PATCH",
      body: data,
    }),

  activate: (dinoId) =>
    apiRequest(`/dinos/${dinoId}/activate`, {
      method: "PATCH",
    }),

  deactivate: (dinoId) =>
    apiRequest(`/dinos/${dinoId}/deactivate`, {
      method: "PATCH",
    }),

  remove: (dinoId) =>
    apiRequest(`/dinos/${dinoId}`, {
      method: "DELETE",
    }),
};
