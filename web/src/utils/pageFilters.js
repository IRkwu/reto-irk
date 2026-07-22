import { getStoredSettings } from "./settings";

const PAGE_FILTERS_STORAGE_PREFIX = "reto-irk-page-filters";

function getPageFilterKey(pageId) {
  return `${PAGE_FILTERS_STORAGE_PREFIX}:${pageId}`;
}

export function getStoredPageFilters(pageId, fallback = {}) {
  if (!getStoredSettings().rememberPageFilters) {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(getPageFilterKey(pageId));
    return storedValue ? { ...fallback, ...JSON.parse(storedValue) } : fallback;
  } catch {
    return fallback;
  }
}

export function savePageFilters(pageId, filters) {
  if (!getStoredSettings().rememberPageFilters) {
    return;
  }

  try {
    window.localStorage.setItem(getPageFilterKey(pageId), JSON.stringify(filters));
  } catch {
    // Los filtros siguen funcionando aunque storage falle.
  }
}
