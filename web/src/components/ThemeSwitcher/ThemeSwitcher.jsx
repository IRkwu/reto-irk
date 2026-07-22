import { useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import {
  applyMode,
  applyTheme,
  getMode,
  getNextMode,
  getNextTheme,
  getStoredModeId,
  getStoredThemeId,
  getTheme,
} from "../../utils/themes";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => getTheme(getStoredThemeId()));
  const [mode, setMode] = useState(() => getMode(getStoredModeId()));

  function changeTheme() {
    const nextTheme = getNextTheme(theme.id);
    setTheme(applyTheme(nextTheme.id));
  }

  function changeMode() {
    const nextMode = getNextMode(mode.id);
    setMode(applyMode(nextMode.id));
  }

  return (
    <>
      <button
        className="btn ghost theme-switcher"
        type="button"
        aria-label={`Cambiar tema. Tema actual: ${theme.name}`}
        title={`Tema actual: ${theme.name}`}
        onClick={changeTheme}
      >
        <Icon icon="mdi:palette-outline" width={18} aria-hidden="true" />
        <span className="theme-switcher-label">{theme.name}</span>
      </button>
      <button
        className="btn ghost theme-switcher"
        type="button"
        aria-label={`Cambiar modo. Modo actual: ${mode.name}`}
        title={`Modo actual: ${mode.name}`}
        onClick={changeMode}
      >
        <Icon
          icon={mode.id === "dark" ? "mdi:weather-night" : "mdi:white-balance-sunny"}
          width={18}
          aria-hidden="true"
        />
        <span className="theme-switcher-label">{mode.name}</span>
      </button>
    </>
  );
}
