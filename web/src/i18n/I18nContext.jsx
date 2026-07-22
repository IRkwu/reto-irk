import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultLanguage,
  dictionaries,
  LANGUAGE_STORAGE_KEY,
  languageOptions,
} from "./dictionaries";
import { I18nContext } from "./I18nContextValue";

function readStoredLanguage() {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return languageOptions.some((option) => option.id === storedLanguage)
      ? storedLanguage
      : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
}

function writeStoredLanguage(language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // La app sigue usando el idioma en memoria aunque storage falle.
  }
}

function readPath(source, path) {
  return path.split(".").reduce((current, segment) => current?.[segment], source);
}

function interpolate(value, params = {}) {
  return String(value).replace(/\{(\w+)\}/g, (match, key) =>
    params[key] == null ? match : String(params[key])
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => readStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    const safeLanguage = languageOptions.some((option) => option.id === nextLanguage)
      ? nextLanguage
      : defaultLanguage;

    setLanguageState(safeLanguage);
    writeStoredLanguage(safeLanguage);
    document.documentElement.lang = safeLanguage;
  }, []);

  const t = useCallback((key, params) => {
    const languageValue = readPath(dictionaries[language], key);
    const fallbackValue = readPath(dictionaries[defaultLanguage], key);
    const value = languageValue ?? fallbackValue ?? key;

    return interpolate(value, params);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
