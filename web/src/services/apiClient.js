const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_CONFIG_ERROR = "Falta configurar VITE_API_BASE_URL para conectar con la API.";

export const TOKEN_STORAGE_KEY = "reto_irk_token";
export const USER_STORAGE_KEY = "reto_irk_user";

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function isFormData(body) {
  return body instanceof FormData;
}

function isUrlEncoded(body) {
  return body instanceof URLSearchParams;
}

function buildUrl(endpoint, query) {
  if (!API_BASE_URL) {
    throw new Error(API_CONFIG_ERROR);
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export function resolveAssetUrl(url) {
  if (!url || typeof url !== "string") {
    return url;
  }

  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  if (url.startsWith("/assets/")) {
    return url;
  }

  if (url.startsWith("/static/")) {
    return `${API_BASE_URL}${url}`;
  }

  return url;
}

function normalizeApiData(data) {
  if (Array.isArray(data)) {
    return data.map(normalizeApiData);
  }

  if (!data || typeof data !== "object") {
    return data;
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      key === "image_url" ? resolveAssetUrl(value) : normalizeApiData(value),
    ])
  );
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getErrorMessage(data) {
  let message = data?.detail || data?.message || "Error en la solicitud";

  if (Array.isArray(message)) {
    message = message
      .map((error) => `${error.loc?.join(".") || "campo"}: ${error.msg}`)
      .join(" | ");
  }

  if (typeof message === "object") {
    message = JSON.stringify(message);
  }

  return message;
}

export async function apiRequest(endpoint, options = {}) {
  const {
    body,
    headers: customHeaders,
    query,
    skipAuth = false,
    ...requestOptions
  } = options;
  const token = getToken();
  const headers = { ...(customHeaders || {}) };

  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    body &&
    !isFormData(body) &&
    !isUrlEncoded(body) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  const url = buildUrl(endpoint, query);

  try {
    response = await fetch(url, {
      ...requestOptions,
      headers,
      body:
        body && !isFormData(body) && !isUrlEncoded(body)
          ? JSON.stringify(body)
          : body,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con la API. Revisa que el backend este activo."
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return normalizeApiData(data);
}

export { API_BASE_URL };
