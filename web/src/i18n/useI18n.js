import { useContext } from "react";
import { I18nContext } from "./I18nContextValue";
import { defaultLanguage, dictionaries } from "./dictionaries";

function readPath(source, path) {
  return path.split(".").reduce((current, segment) => current?.[segment], source);
}

function fallbackT(key, params = {}) {
  const value = readPath(dictionaries[defaultLanguage], key) ?? key;

  return String(value).replace(/\{(\w+)\}/g, (match, paramKey) =>
    params[paramKey] == null ? match : String(params[paramKey])
  );
}

export function useI18n() {
  return useContext(I18nContext) || {
    language: defaultLanguage,
    setLanguage: () => {},
    t: fallbackT,
  };
}
