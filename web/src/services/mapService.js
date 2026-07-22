import { apiRequest } from "./apiClient";

export const mapService = {
  list: (query) =>
    apiRequest("/maps", {
      query,
    }),

  get: (mapId) => apiRequest(`/maps/${mapId}`),

  create: (data) =>
    apiRequest("/maps", {
      method: "POST",
      body: data,
    }),

  update: (mapId, data) =>
    apiRequest(`/maps/${mapId}`, {
      method: "PATCH",
      body: data,
    }),

  activate: (mapId) =>
    apiRequest(`/maps/${mapId}/activate`, {
      method: "PATCH",
    }),

  deactivate: (mapId) =>
    apiRequest(`/maps/${mapId}/deactivate`, {
      method: "PATCH",
    }),

  remove: (mapId) =>
    apiRequest(`/maps/${mapId}`, {
      method: "DELETE",
    }),

  addDino: (mapId, dinoId) =>
    apiRequest(`/maps/${mapId}/dinos/${dinoId}`, {
      method: "POST",
    }),

  removeDino: (mapId, dinoId) =>
    apiRequest(`/maps/${mapId}/dinos/${dinoId}`, {
      method: "DELETE",
    }),
};

export const spawnZoneService = {
  list: (mapId, query) =>
    apiRequest(`/maps/${mapId}/spawn-zones`, {
      query,
    }),

  create: (mapId, data) =>
    apiRequest(`/maps/${mapId}/spawn-zones`, {
      method: "POST",
      body: data,
    }),

  update: (mapId, spawnZoneId, data) =>
    apiRequest(`/maps/${mapId}/spawn-zones/${spawnZoneId}`, {
      method: "PATCH",
      body: data,
    }),

  remove: (mapId, spawnZoneId) =>
    apiRequest(`/maps/${mapId}/spawn-zones/${spawnZoneId}`, {
      method: "DELETE",
    }),
};
