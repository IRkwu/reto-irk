import { useCallback, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Icon } from "../AppIcon/AppIcon.jsx";
import AppSelect from "../AppSelect/AppSelect.jsx";
import { useNotifications } from "../Notifications";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { languageOptions, useI18n } from "../../i18n";
import {
  buttonLabelOptions,
  defaultSettings,
  densityOptions,
  getStoredSettings,
  modeOptions,
  resetStoredSettings,
  themePresets,
  updateStoredSettings,
} from "../../utils/settings";
import "./SettingsPanel.css";

export default function SettingsPanel() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const { success } = useNotifications();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => getStoredSettings());
  const closePanel = useCallback(() => setOpen(false), []);
  const panelRef = useModalAccessibility(open, closePanel);

  function updateSetting(key, value) {
    setSettings(updateStoredSettings({ [key]: value }));
  }

  function resetSettings() {
    setSettings(resetStoredSettings());
    success(t("settings.resetNotice"));
  }

  function openObsConfig() {
    setOpen(false);
    navigate("/obs/config");
  }

  const panel = open ? createPortal(
    <div className="settings-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closePanel()}>
      <aside
        className="settings-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-panel-head">
          <div>
            <div className="h2" id={titleId}>{t("settings.title")}</div>
            <p className="muted">{t("settings.description")}</p>
          </div>
          <button
            className="btn ghost icon-only"
            type="button"
            onClick={closePanel}
            title={t("settings.close")}
            aria-label={t("settings.close")}
          >
            <Icon icon="mdi:close" width={20} aria-hidden="true" />
          </button>
        </div>

        <SettingsSection title={t("settings.appearanceTitle")} description={t("settings.appearanceDescription")}>
          <SettingSelect
            label={t("settings.theme")}
            value={settings.themeId}
            options={themePresets}
            onChange={(value) => updateSetting("themeId", value)}
          />
          <SettingChoice
            label={t("settings.mode")}
            value={settings.modeId}
            options={modeOptions}
            onChange={(value) => updateSetting("modeId", value)}
            optionLabelKeyPrefix="settings.choices"
          />
        </SettingsSection>

        <SettingsSection title={t("settings.interfaceTitle")} description={t("settings.interfaceDescription")}>
          <SettingSelect
            label={t("settings.language")}
            value={language}
            options={languageOptions}
            onChange={setLanguage}
          />
          <SettingChoice
            label={t("settings.density")}
            value={settings.density}
            options={densityOptions}
            onChange={(value) => updateSetting("density", value)}
            optionLabelKeyPrefix="settings.choices"
          />
          <SettingChoice
            label={t("settings.buttonLabels")}
            value={settings.buttonLabels}
            options={buttonLabelOptions}
            onChange={(value) => updateSetting("buttonLabels", value)}
            optionLabelKeyPrefix="settings.choices"
          />
        </SettingsSection>

        <SettingsSection title={t("settings.behaviorTitle")} description={t("settings.behaviorDescription")}>
          <div className="settings-toggle-list">
            <SettingToggle
              label={t("settings.rememberFilters")}
              checked={settings.rememberPageFilters}
              onChange={(value) => updateSetting("rememberPageFilters", value)}
            />
            <SettingToggle
              label={t("settings.confirmDangerous")}
              checked={settings.confirmDangerousActions}
              onChange={(value) => updateSetting("confirmDangerousActions", value)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title={t("settings.obsTitle")} description={t("settings.obsDescription")}>
          <button
            className="settings-obs-button"
            type="button"
            onClick={openObsConfig}
            title={t("settings.configureObs")}
            aria-label={t("settings.configureObs")}
          >
            <Icon icon="mdi:monitor-cog" width={18} aria-hidden="true" />
            {t("settings.configureObs")}
          </button>
        </SettingsSection>

        <SettingsSection title={t("settings.resetTitle")} description={t("settings.resetDescription")}>
          <button
            className="settings-reset-button"
            type="button"
            onClick={resetSettings}
            disabled={JSON.stringify(settings) === JSON.stringify(defaultSettings)}
          >
            <Icon icon="mdi:restore" width={18} aria-hidden="true" />
            {t("settings.resetButton")}
          </button>
        </SettingsSection>
      </aside>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        className="btn ghost settings-trigger"
        type="button"
        onClick={() => setOpen(true)}
        title={t("settings.open")}
        aria-label={t("settings.open")}
      >
        <Icon icon="mdi:cog-outline" width={18} aria-hidden="true" />
        <span className="settings-trigger-label">{t("settings.trigger")}</span>
      </button>

      {panel}
    </>
  );
}

function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

function SettingSelect({ label, value, options, onChange }) {
  const selectId = useId();

  return (
    <AppSelect
      id={selectId}
      label={label}
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}

function SettingChoice({ label, value, options, onChange, optionLabelKeyPrefix = "" }) {
  const { t } = useI18n();

  return (
    <fieldset className="settings-group">
      <legend>{label}</legend>
      <div className={`settings-choice-grid ${options.length === 3 ? "three" : "two"}`}>
        {options.map((option) => {
          const optionName = optionLabelKeyPrefix
            ? t(`${optionLabelKeyPrefix}.${option.id === "icons-only" ? "iconsOnly" : option.id}`)
            : option.name;

          return (
            <button
              className={`settings-choice ${value === option.id ? "selected" : ""}`}
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={value === option.id}
              title={t("settings.selectOption", { name: optionName })}
              aria-label={t("settings.selectOption", { name: optionName })}
            >
              {optionName}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function SettingToggle({ label, checked, onChange }) {
  return (
    <label className="settings-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
