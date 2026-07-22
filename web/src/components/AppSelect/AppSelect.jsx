import { useId, useMemo, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import { useI18n } from "../../i18n";
import "./AppSelect.css";

export default function AppSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const generatedId = useId();
  const selectId = id || generatedId;
  const normalizedOptions = useMemo(
    () =>
      options.map((option) => ({
        id: option.id ?? option.value,
        name: option.name ?? option.label,
      })),
    [options]
  );
  const selectedOption = useMemo(
    () =>
      normalizedOptions.find((option) => String(option.id) === String(value)) ||
      normalizedOptions[0],
    [normalizedOptions, value]
  );
  const labelId = `${selectId}-label`;
  const valueId = `${selectId}-value`;
  const menuId = `${selectId}-menu`;

  function selectOption(optionId) {
    if (disabled) {
      return;
    }

    onChange(optionId);
    setOpen(false);
  }

  function handleButtonKeyDown(event) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      className={`app-select-field ${className}`.trim()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      {label ? <span id={labelId}>{label}</span> : null}
      <div className="app-select-control">
        <button
          className="app-select-button"
          type="button"
          id={selectId}
          aria-haspopup="listbox"
          aria-expanded={open && !disabled}
          aria-controls={menuId}
          aria-labelledby={`${label ? labelId : ""} ${valueId}`.trim()}
          disabled={disabled}
          onClick={() => setOpen((next) => !next)}
          onKeyDown={handleButtonKeyDown}
        >
          <span id={valueId}>{selectedOption?.name || t("common.select")}</span>
          <Icon icon="mdi:chevron-down" width={18} aria-hidden="true" />
        </button>

        {open && !disabled ? (
          <div
            className="app-select-menu"
            id={menuId}
            role="listbox"
            aria-labelledby={label ? labelId : undefined}
            tabIndex={-1}
          >
            {normalizedOptions.map((option) => (
              <button
                className={`app-select-option ${String(value) === String(option.id) ? "selected" : ""}`}
                key={option.id}
                type="button"
                role="option"
                aria-selected={String(value) === String(option.id)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option.id);
                }}
                onClick={() => selectOption(option.id)}
              >
                <span>{option.name}</span>
                {value === option.id ? (
                  <Icon icon="mdi:check" width={17} aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
