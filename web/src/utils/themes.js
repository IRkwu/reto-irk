export const THEME_STORAGE_KEY = "reto-irk-theme";
export const MODE_STORAGE_KEY = "reto-irk-mode";
export const DEFAULT_THEME_ID = "graphite";
export const DEFAULT_MODE_ID = "system";

export const themePresets = [
  { id: "graphite", name: "Graphite" },
  { id: "elegant-luxury", name: "Elegant Luxury" },
  { id: "kodama-grove", name: "Kodama Grove" },
  { id: "cosmic-night", name: "Cosmic Night" },
  { id: "bubblegum", name: "Bubblegum" },
  { id: "nature", name: "Nature" },
  { id: "solar-dusk", name: "Solar Dusk" },
  { id: "pastel", name: "Pastel Theme" },
  { id: "mocha-mousse", name: "Mocha Mousse" },
];

export const modeOptions = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "system", name: "System" },
];

export const themes = themePresets;

export function getTheme(themeId) {
  return themePresets.find((theme) => theme.id === themeId) || getTheme(DEFAULT_THEME_ID);
}

export function getMode(modeId) {
  return modeOptions.find((mode) => mode.id === modeId) || getMode(DEFAULT_MODE_ID);
}

function getLegacyMode(themeId) {
  return modeOptions.some((mode) => mode.id === themeId) ? themeId : null;
}

function getSystemModeId() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getStoredThemeId() {
  try {
    const storedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (getLegacyMode(storedThemeId)) {
      return DEFAULT_THEME_ID;
    }

    return getTheme(storedThemeId).id;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export function getStoredModeId() {
  try {
    const storedModeId = window.localStorage.getItem(MODE_STORAGE_KEY);
    const storedThemeId = window.localStorage.getItem(THEME_STORAGE_KEY);

    return getMode(storedModeId || getLegacyMode(storedThemeId)).id;
  } catch {
    return DEFAULT_MODE_ID;
  }
}

export function applyTheme(themeId) {
  const nextTheme = getTheme(themeId);

  document.documentElement.dataset.theme = nextTheme.id;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme.id);
  } catch {
    // El tema sigue funcionando aunque el navegador bloquee storage.
  }

  return nextTheme;
}

export function applyMode(modeId) {
  const nextMode = getMode(modeId);
  const appliedModeId = nextMode.id === "system" ? getSystemModeId() : nextMode.id;

  document.documentElement.dataset.mode = appliedModeId;
  document.documentElement.dataset.modePreference = nextMode.id;
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, nextMode.id);
  } catch {
    // El modo sigue funcionando aunque el navegador bloquee storage.
  }

  return nextMode;
}

export function applyThemeSettings(themeId, modeId) {
  return {
    theme: applyTheme(themeId),
    mode: applyMode(modeId),
  };
}

export function applyStoredTheme() {
  return applyThemeSettings(getStoredThemeId(), getStoredModeId());
}

export function getNextTheme(themeId) {
  const currentIndex = themePresets.findIndex((theme) => theme.id === themeId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % themePresets.length : 0;

  return themePresets[nextIndex];
}

export function getNextMode(modeId) {
  const currentIndex = modeOptions.findIndex((mode) => mode.id === modeId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % modeOptions.length : 0;

  return modeOptions[nextIndex];
}
