import { apiRequest, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "./apiClient";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getStoredSession() {
  return {
    token: getStoredToken(),
    user: getStoredUser(),
  };
}

export async function loginRequest({ username, password }) {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);

  const tokenData = await apiRequest("/auth/token", {
    method: "POST",
    body: form,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    skipAuth: true,
  });

  localStorage.setItem(TOKEN_STORAGE_KEY, tokenData.access_token);

  const user = await apiRequest("/auth/me");
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  return { token: tokenData.access_token, user };
}

export async function refreshCurrentUser() {
  const user = await apiRequest("/auth/me");
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function logoutRequest() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}
