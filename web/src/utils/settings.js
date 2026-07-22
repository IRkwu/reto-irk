import {
  applyThemeSettings,
  getMode,
  getStoredModeId,
  getStoredThemeId,
  getTheme,
  MODE_STORAGE_KEY,
  modeOptions,
  THEME_STORAGE_KEY,
  themePresets,
} from "./themes";

export {
  MODE_STORAGE_KEY,
  modeOptions,
  THEME_STORAGE_KEY,
  themePresets,
};

export const DENSITY_STORAGE_KEY = "reto-irk-density";
export const BUTTON_LABELS_STORAGE_KEY = "reto-irk-button-labels";
export const LEGACY_CARD_LAYOUT_STORAGE_KEY = "reto-irk-card-layout";
export const OVERLAY_MODE_STORAGE_KEY = "reto-irk-overlay-mode";
export const LEGACY_EVENT_DISPLAY_STORAGE_KEY = "reto-irk-event-display";
export const REMEMBER_PAGE_FILTERS_STORAGE_KEY = "reto-irk-remember-page-filters";
export const OVERLAY_FONT_SIZE_STORAGE_KEY = "reto-irk-overlay-font-size";
export const OVERLAY_EVENT_LIMIT_STORAGE_KEY = "reto-irk-overlay-event-limit";
export const CONFIRM_DANGEROUS_ACTIONS_STORAGE_KEY =
  "reto-irk-confirm-dangerous-actions";
export const LEGACY_CONFIRM_DELETE_STORAGE_KEY = "reto-irk-confirm-delete";

export const densityOptions = [
  { id: "comfortable", name: "Comfortable" },
  { id: "compact", name: "Compact" },
];

export const buttonLabelOptions = [
  { id: "always", name: "Always" },
  { id: "icons-only", name: "Icons only" },
];

export const overlayModeOptions = [
  { id: "app-theme", name: "App theme" },
  { id: "dark", name: "Dark" },
  { id: "transparent", name: "Transparent" },
];

export const overlayFontSizeOptions = [
  { id: "normal", name: "Normal" },
  { id: "large", name: "Large" },
  { id: "huge", name: "Huge" },
];

export const overlayEventLimitOptions = [
  { id: "3", name: "3 eventos" },
  { id: "5", name: "5 eventos" },
  { id: "10", name: "10 eventos" },
];

export const defaultSettings = {
  themeId: "graphite",
  modeId: "system",
  density: "comfortable",
  buttonLabels: "always",
  overlayMode: "app-theme",
  rememberPageFilters: false,
  overlayFontSize: "normal",
  overlayEventLimit: "5",
  confirmDangerousActions: true,
};

function readStoredValue(key, fallback) {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // La configuracion visual sigue funcionando aunque storage falle.
  }
}

function getOption(options, optionId, fallbackId) {
  return options.some((option) => option.id === optionId) ? optionId : fallbackId;
}

function getStoredButtonLabels() {
  const storedValue = readStoredValue(
    BUTTON_LABELS_STORAGE_KEY,
    defaultSettings.buttonLabels
  );

  if (storedValue === "auto") {
    writeStoredValue(BUTTON_LABELS_STORAGE_KEY, defaultSettings.buttonLabels);
    return defaultSettings.buttonLabels;
  }

  return getOption(
    buttonLabelOptions,
    storedValue,
    defaultSettings.buttonLabels
  );
}

function getStoredConfirmDangerousActions() {
  const storedValue = readStoredValue(
    CONFIRM_DANGEROUS_ACTIONS_STORAGE_KEY,
    null
  );

  if (storedValue != null) {
    return storedValue === "true";
  }

  const legacyValue = readStoredValue(
    LEGACY_CONFIRM_DELETE_STORAGE_KEY,
    String(defaultSettings.confirmDangerousActions)
  );
  const nextValue = legacyValue === "true";

  writeStoredValue(CONFIRM_DANGEROUS_ACTIONS_STORAGE_KEY, nextValue);
  return nextValue;
}

function getStoredBoolean(key, fallback) {
  const storedValue = readStoredValue(key, null);

  if (storedValue == null) {
    return fallback;
  }

  return storedValue === "true";
}

function getStoredDensity() {
  const storedDensity = readStoredValue(DENSITY_STORAGE_KEY, null);

  if (storedDensity) {
    return getOption(densityOptions, storedDensity, defaultSettings.density);
  }

  const legacyCardLayout = readStoredValue(LEGACY_CARD_LAYOUT_STORAGE_KEY, "");
  const legacyEventDisplay = readStoredValue(LEGACY_EVENT_DISPLAY_STORAGE_KEY, "");
  const nextDensity =
    legacyCardLayout === "compact" || legacyEventDisplay === "compact"
      ? "compact"
      : defaultSettings.density;

  writeStoredValue(DENSITY_STORAGE_KEY, nextDensity);
  return nextDensity;
}

export function getStoredSettings() {
  return {
    themeId: getTheme(getStoredThemeId()).id,
    modeId: getMode(getStoredModeId()).id,
    density: getStoredDensity(),
    buttonLabels: getStoredButtonLabels(),
    overlayMode: getOption(
      overlayModeOptions,
      readStoredValue(OVERLAY_MODE_STORAGE_KEY, defaultSettings.overlayMode),
      defaultSettings.overlayMode
    ),
    rememberPageFilters: getStoredBoolean(
      REMEMBER_PAGE_FILTERS_STORAGE_KEY,
      defaultSettings.rememberPageFilters
    ),
    overlayFontSize: getOption(
      overlayFontSizeOptions,
      readStoredValue(OVERLAY_FONT_SIZE_STORAGE_KEY, defaultSettings.overlayFontSize),
      defaultSettings.overlayFontSize
    ),
    overlayEventLimit: getOption(
      overlayEventLimitOptions,
      readStoredValue(OVERLAY_EVENT_LIMIT_STORAGE_KEY, defaultSettings.overlayEventLimit),
      defaultSettings.overlayEventLimit
    ),
    confirmDangerousActions: getStoredConfirmDangerousActions(),
  };
}

export function applySettings(settings) {
  const nextSettings = { ...defaultSettings, ...settings };
  const root = document.documentElement;

  applyThemeSettings(nextSettings.themeId, nextSettings.modeId);
  root.dataset.density = nextSettings.density;
  root.dataset.buttonLabels = nextSettings.buttonLabels;
  root.dataset.overlayMode = nextSettings.overlayMode;
  root.dataset.rememberPageFilters = String(nextSettings.rememberPageFilters);
  root.dataset.overlayFontSize = nextSettings.overlayFontSize;
  root.dataset.overlayEventLimit = nextSettings.overlayEventLimit;
  root.dataset.confirmDangerousActions = String(nextSettings.confirmDangerousActions);
  delete root.dataset.reducedMotion;
  delete root.dataset.showInactivePlayers;
  delete root.dataset.confirmDelete;
  delete root.dataset.focusHighlight;
  delete root.dataset.cardLayout;
  delete root.dataset.eventDisplay;
  delete root.dataset.compactStats;
  delete root.dataset.textSize;
  delete root.dataset.modalSize;

  return nextSettings;
}

export function saveSettings(settings) {
  const nextSettings = applySettings(settings);

  writeStoredValue(THEME_STORAGE_KEY, nextSettings.themeId);
  writeStoredValue(MODE_STORAGE_KEY, nextSettings.modeId);
  writeStoredValue(DENSITY_STORAGE_KEY, nextSettings.density);
  writeStoredValue(BUTTON_LABELS_STORAGE_KEY, nextSettings.buttonLabels);
  writeStoredValue(OVERLAY_MODE_STORAGE_KEY, nextSettings.overlayMode);
  writeStoredValue(REMEMBER_PAGE_FILTERS_STORAGE_KEY, nextSettings.rememberPageFilters);
  writeStoredValue(OVERLAY_FONT_SIZE_STORAGE_KEY, nextSettings.overlayFontSize);
  writeStoredValue(OVERLAY_EVENT_LIMIT_STORAGE_KEY, nextSettings.overlayEventLimit);
  writeStoredValue(
    CONFIRM_DANGEROUS_ACTIONS_STORAGE_KEY,
    nextSettings.confirmDangerousActions
  );

  window.dispatchEvent(new CustomEvent("reto-irk-settings-change", {
    detail: nextSettings,
  }));

  return nextSettings;
}

export function updateStoredSettings(patch) {
  return saveSettings({
    ...getStoredSettings(),
    ...patch,
  });
}

export function applyStoredSettings() {
  return applySettings(getStoredSettings());
}

export function resetStoredSettings() {
  return saveSettings(defaultSettings);
}

export function shouldConfirmDangerousActions() {
  return getStoredSettings().confirmDangerousActions;
}
