import { DEFAULT_THEME_ID, getMode, getTheme } from "./themes";
import { defaultSettings, getStoredSettings } from "./settings";

export const OVERLAY_CONFIG_STORAGE_PREFIX = "reto-irk-overlay-config";
export const OVERLAY_GLOBAL_CONFIG_STORAGE_SCOPE = "global";
export const OBS_CONFIG_GUIDE_STORAGE_KEY = "reto-irk-obs-config-guide-seen";
export const OVERLAY_STAGE_WIDTH = 1920;
export const OVERLAY_STAGE_HEIGHT = 1080;
export const OVERLAY_MIN_WIDTH = 320;
export const OVERLAY_MIN_HEIGHT = 180;
export const OVERLAY_MAX_WIDTH = 3840;
export const OVERLAY_MAX_HEIGHT = 2160;
export const OVERLAY_MIN_WIDGET_SCALE = 0.5;
export const OVERLAY_MAX_WIDGET_SCALE = 2;
export const DEFAULT_OVERLAY_FORMAT = "16:9";
export const DEFAULT_OVERLAY_MODE = "app-theme";
export const DEFAULT_OVERLAY_THEME_MODE = "dark";

export const overlayResolutionPresets = [
  { id: "16:9", name: "16:9", ratio: { w: 16, h: 9 } },
  { id: "4:3", name: "4:3", ratio: { w: 4, h: 3 } },
  { id: "21:9", name: "21:9", ratio: { w: 21, h: 9 } },
  { id: "32:9", name: "32:9", ratio: { w: 32, h: 9 } },
  { id: "1:1", name: "1:1", ratio: { w: 1, h: 1 } },
];

const legacyResolutionPresetMap = {
  "1920x1080": "16:9",
  "1366x768": "16:9",
  "1280x720": "16:9",
  "1600x900": "16:9",
  "2560x1440": "16:9",
};

export const overlayWidgetLabels = {
  title: "Titulo del reto",
  lives: "Vidas / HP",
  dinos: "Dinos",
  notifications: "Notificaciones",
  players: "Jugadores",
};

export const overlayWidgetOrder = [
  "title",
  "lives",
  "dinos",
  "notifications",
  "players",
];

export const overlayWidgetWidthLimits = {
  title: { minWidth: 140, maxWidth: 280 },
  lives: { minWidth: 220, maxWidth: 220 },
  dinos: { minWidth: 180, maxWidth: 180 },
  notifications: { minWidth: 290, maxWidth: 540 },
  players: { minWidth: 65, maxWidth: 900 },
};

export const overlayWidgetBasePositions = {
  title: { anchor: "top-left", offsetX: 24, offsetY: 24 },
  players: { anchor: "top-left", offsetX: 24, offsetY: 140 },
  lives: { anchor: "bottom-left", offsetX: 24, offsetY: 24 },
  dinos: { anchor: "bottom-right", offsetX: 24, offsetY: 24 },
  notifications: { anchor: "top-right", offsetX: 24, offsetY: 24 },
};

export function getPlayerWidgetWidth(alignment, displayMode, playersCount = 1) {
  const safePlayersCount = Math.max(1, playersCount);

  if (alignment === "horizontal") {
    return displayMode === "icon" ? safePlayersCount * 70 : safePlayersCount * 93;
  }

  return displayMode === "icon" ? 65 : 170;
}

export function getOverlayWidgetWidthLimits(widgetKey, widget, playersCount = 1) {
  if (widgetKey === "players") {
    const alignment = widget?.align === "horizontal" || widget?.layout === "horizontal"
      ? "horizontal"
      : widget?.align || "left";
    const displayMode = widget?.displayMode || "icon-name";
    const minWidth = getPlayerWidgetWidth(alignment, displayMode, playersCount);

    return { minWidth, maxWidth: 900 };
  }

  return overlayWidgetWidthLimits[widgetKey] || { minWidth: 0, maxWidth: 900 };
}

export const defaultOverlayConfig = {
  id: "default",
  name: "Default OBS",
  widgetScale: 1,
  appearance: {
    themeId: DEFAULT_THEME_ID,
    modeId: DEFAULT_OVERLAY_THEME_MODE,
    overlayMode: DEFAULT_OVERLAY_MODE,
  },
  resolution: {
    width: OVERLAY_STAGE_WIDTH,
    height: OVERLAY_STAGE_HEIGHT,
    label: DEFAULT_OVERLAY_FORMAT,
    preset: DEFAULT_OVERLAY_FORMAT,
  },
  widgetsByFormat: {},
  widgets: {
    title: {
      visible: true,
      x: 24,
      y: 24,
      width: 220,
      minWidth: 0,
      size: 1,
      opacity: 0.9,
      align: "left",
      showMap: true,
    },
    lives: {
      visible: true,
      x: 4,
      y: 992,
      width: 220,
      minWidth: 0,
      size: 1,
      opacity: 1,
      align: "left",
    },
    dinos: {
      visible: true,
      x: 1730,
      y: 1014,
      width: 180,
      minWidth: 0,
      size: 1,
      opacity: 1,
      align: "right",
    },
    notifications: {
      visible: true,
      x: 1496,
      y: 24,
      width: 380,
      minWidth: 0,
      size: 1,
      opacity: 0.96,
      align: "left",
      duration: 5,
      durationMs: 5000,
      animationDirection: "right-to-left",
      accentPosition: "left",
      maxVisible: 3,
    },
    players: {
      visible: true,
      x: 24,
      y: 150,
      width: 170,
      minWidth: 0,
      size: 1,
      opacity: 0.9,
      align: "left",
      layout: "vertical",
      displayMode: "icon-name",
    },
  },
};

function getSystemModeId() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function normalizeOverlayAppearance(appearance) {
  const mode = getMode(appearance?.modeId || DEFAULT_OVERLAY_THEME_MODE);
  const overlayMode = ["app-theme", "dark", "transparent"].includes(appearance?.overlayMode)
    ? appearance.overlayMode
    : DEFAULT_OVERLAY_MODE;

  return {
    themeId: getTheme(appearance?.themeId || DEFAULT_THEME_ID).id,
    modeId: mode.id,
    overlayMode,
  };
}

function getCurrentOverlayAppearance() {
  const storedSettings = getStoredSettings();
  const root = document.documentElement;

  return normalizeOverlayAppearance({
    themeId: root.dataset.theme || storedSettings.themeId,
    modeId: root.dataset.mode || storedSettings.modeId,
    overlayMode: root.dataset.overlayMode || storedSettings.overlayMode || defaultSettings.overlayMode,
  });
}

function storageKey(challengeId, configId = defaultOverlayConfig.id) {
  return `${OVERLAY_CONFIG_STORAGE_PREFIX}:${challengeId}:${configId}`;
}

function globalStorageKey(configId = defaultOverlayConfig.id) {
  return storageKey(OVERLAY_GLOBAL_CONFIG_STORAGE_SCOPE, configId);
}

export function hasSeenObsConfigGuide() {
  try {
    return window.localStorage.getItem(OBS_CONFIG_GUIDE_STORAGE_KEY) === "true";
  } catch {
    return true;
  }
}

export function markObsConfigGuideSeen() {
  try {
    window.localStorage.setItem(OBS_CONFIG_GUIDE_STORAGE_KEY, "true");
  } catch {
    // El boton OBS sigue funcionando aunque storage falle.
  }
}

function normalizeWidget(widget, fallback) {
  const { compact: _compact, ...sourceWidget } = widget || {};
  const durationMs = Number(
    sourceWidget?.durationMs ?? (sourceWidget?.duration != null ? Number(sourceWidget.duration) * 1000 : fallback.durationMs)
  );
  const maxVisible = Number(sourceWidget?.maxVisible ?? fallback.maxVisible);

  return {
    ...fallback,
    ...sourceWidget,
    visible: sourceWidget?.visible ?? fallback.visible,
    x: Number(sourceWidget?.x ?? fallback.x),
    y: Number(sourceWidget?.y ?? fallback.y),
    width: Number(sourceWidget?.width ?? fallback.width),
    minWidth: Math.max(0, Number(sourceWidget?.minWidth ?? fallback.minWidth ?? 0)),
    size: clampScale(sourceWidget?.size, fallback.size),
    opacity: Number(sourceWidget?.opacity ?? fallback.opacity),
    maxVisible: Number.isFinite(maxVisible) ? Math.min(5, Math.max(1, maxVisible)) : fallback.maxVisible,
    duration: Number(sourceWidget?.duration ?? fallback.duration),
    durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : fallback.durationMs,
    animationDirection: sourceWidget?.animationDirection || fallback.animationDirection,
    accentPosition: sourceWidget?.accentPosition || fallback.accentPosition,
  };
}

function clampScale(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return Math.min(OVERLAY_MAX_WIDGET_SCALE, Math.max(OVERLAY_MIN_WIDGET_SCALE, number));
}

function normalizeResolution(resolution) {
  const presetIds = new Set(overlayResolutionPresets.map((presetItem) => presetItem.id));
  const resolvedPreset = legacyResolutionPresetMap[resolution?.preset] || resolution?.preset || DEFAULT_OVERLAY_FORMAT;
  const preset = presetIds.has(resolvedPreset) ? resolvedPreset : DEFAULT_OVERLAY_FORMAT;
  const presetConfig = overlayResolutionPresets.find((presetItem) => presetItem.id === preset);
  const ratio = presetConfig?.ratio || { w: 16, h: 9 };
  const width = OVERLAY_STAGE_WIDTH;
  const height = Math.round((width * ratio.h) / ratio.w);

  return {
    width,
    height,
    label: preset,
    preset,
  };
}

function normalizeWidgetPosition(position, fallback) {
  const sourcePosition = position || fallback;
  const fallbackPosition = fallback || { anchor: "top-left", offsetX: 0, offsetY: 0 };
  const validAnchors = new Set(["top-left", "top-right", "bottom-left", "bottom-right"]);
  const anchor = validAnchors.has(sourcePosition?.anchor) ? sourcePosition.anchor : fallbackPosition.anchor;
  const offsetX = Math.max(0, Number(sourcePosition?.offsetX ?? fallbackPosition.offsetX ?? 0));
  const offsetY = Math.max(0, Number(sourcePosition?.offsetY ?? fallbackPosition.offsetY ?? 0));

  return {
    anchor,
    offsetX,
    offsetY,
  };
}

function normalizeFormatProfile(profile) {
  const nextProfile = {};

  overlayWidgetOrder.forEach((key) => {
    const fallbackPosition = overlayWidgetBasePositions[key] || { anchor: "top-left", offsetX: 0, offsetY: 0 };

    nextProfile[key] = {
      position: normalizeWidgetPosition(profile?.[key]?.position, fallbackPosition),
    };
  });

  return nextProfile;
}

export function normalizeOverlayConfig(config) {
  const widgets = {};
  const resolution = normalizeResolution(config?.resolution);
  const widgetsByFormat = {
    ...(config?.widgetsByFormat || {}),
  };
  const activeProfile = normalizeFormatProfile(widgetsByFormat[resolution.preset]);

  widgetsByFormat[resolution.preset] = activeProfile;

  overlayWidgetOrder.forEach((key) => {
    const widthLimits = getOverlayWidgetWidthLimits(key, config?.widgets?.[key]);
    widgets[key] = normalizeWidget(
      {
        ...config?.widgets?.[key],
        minWidth: widthLimits.minWidth,
      },
      {
        ...defaultOverlayConfig.widgets[key],
        minWidth: widthLimits.minWidth,
      }
    );
    widgets[key].width = Math.min(widthLimits.maxWidth, Math.max(widthLimits.minWidth, widgets[key].width));
    widgets[key].position = activeProfile[key].position;
  });

  return {
    ...defaultOverlayConfig,
    ...(config || {}),
    id: config?.id || defaultOverlayConfig.id,
    widgetScale: clampScale(config?.widgetScale, defaultOverlayConfig.widgetScale),
    appearance: normalizeOverlayAppearance(config?.appearance),
    resolution,
    widgetsByFormat,
    widgets,
  };
}

export function applyOverlayAppearance(config) {
  const appearance = normalizeOverlayConfig(config).appearance;
  const appliedModeId = appearance.modeId === "system" ? getSystemModeId() : appearance.modeId;
  const root = document.documentElement;

  root.dataset.theme = appearance.themeId;
  root.dataset.mode = appliedModeId;
  root.dataset.modePreference = appearance.modeId;
  root.dataset.overlayMode = appearance.overlayMode;

  return appearance;
}

export function getOverlayBaseScale(config) {
  const nextConfig = normalizeOverlayConfig(config);
  return nextConfig.resolution.width / OVERLAY_STAGE_WIDTH;
}

export function getOverlayWidgetScale(config) {
  const nextConfig = normalizeOverlayConfig(config);
  return getOverlayBaseScale(nextConfig) * nextConfig.widgetScale;
}

export function readOverlayConfig(challengeId, configId = defaultOverlayConfig.id) {
  try {
    const storedValue = window.localStorage.getItem(storageKey(challengeId, configId));
    return normalizeOverlayConfig(storedValue ? JSON.parse(storedValue) : defaultOverlayConfig);
  } catch {
    return normalizeOverlayConfig(defaultOverlayConfig);
  }
}

export function saveOverlayConfig(challengeId, config) {
  const nextConfig = normalizeOverlayConfig(config);

  try {
    window.localStorage.setItem(
      storageKey(challengeId, nextConfig.id),
      JSON.stringify(nextConfig)
    );
  } catch {
    // El overlay sigue funcionando con la configuracion en memoria.
  }

  return nextConfig;
}

export function readGlobalOverlayConfig(configId = defaultOverlayConfig.id) {
  try {
    const storedValue = window.localStorage.getItem(globalStorageKey(configId));
    return normalizeOverlayConfig(storedValue ? JSON.parse(storedValue) : defaultOverlayConfig);
  } catch {
    return normalizeOverlayConfig(defaultOverlayConfig);
  }
}

export function saveGlobalOverlayConfig(config) {
  const nextConfig = normalizeOverlayConfig(config);

  try {
    window.localStorage.setItem(
      globalStorageKey(nextConfig.id),
      JSON.stringify(nextConfig)
    );
  } catch {
    // El overlay sigue funcionando con la configuracion en memoria.
  }

  return nextConfig;
}

export function encodeOverlayConfig(config) {
  try {
    return window.btoa(encodeURIComponent(JSON.stringify(normalizeOverlayConfig(config))));
  } catch {
    return "";
  }
}

export function decodeOverlayConfig(value) {
  try {
    return normalizeOverlayConfig(JSON.parse(decodeURIComponent(window.atob(value))));
  } catch {
    return null;
  }
}

export function getGlobalOverlayConfigFromSearch(searchParams) {
  const encodedConfig = searchParams.get("cfg");
  const configId = searchParams.get("config") || defaultOverlayConfig.id;
  const decodedConfig = encodedConfig ? decodeOverlayConfig(encodedConfig) : null;

  if (decodedConfig) {
    return normalizeOverlayConfig({
      ...decodedConfig,
      id: decodedConfig.id || configId,
    });
  }

  return readGlobalOverlayConfig(configId);
}

export function getOverlayConfigFromSearch(_challengeId, searchParams) {
  return getGlobalOverlayConfigFromSearch(searchParams);
}

export function buildOverlayUrl(challengeId, configId = defaultOverlayConfig.id) {
  const config = normalizeOverlayConfig({
    ...readGlobalOverlayConfig(configId),
    appearance: getCurrentOverlayAppearance(),
  });
  const encodedConfig = encodeOverlayConfig(config);
  const searchParams = new URLSearchParams();

  searchParams.set("config", config.id);
  if (encodedConfig) {
    searchParams.set("cfg", encodedConfig);
  }

  return `/obs/${challengeId}?${searchParams.toString()}`;
}
