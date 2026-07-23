import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const [placement, setPlacement] = useState("down");
  const [menuPosition, setMenuPosition] = useState(null);
  const controlRef = useRef(null);
  const menuRef = useRef(null);
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

  useLayoutEffect(() => {
    if (!open || disabled || !controlRef.current || !menuRef.current) {
      setMenuPosition(null);
      return undefined;
    }

    function positionMenu() {
      const controlBounds = controlRef.current?.getBoundingClientRect();
      const menu = menuRef.current;

      if (!controlBounds || !menu) {
        return;
      }

      const menuHeight = Math.min(menu.scrollHeight, 240);
      const viewportPadding = 8;
      const spaceAbove = Math.max(0, controlBounds.top - viewportPadding);
      const spaceBelow = Math.max(0, window.innerHeight - controlBounds.bottom - viewportPadding);
      const nextPlacement = spaceBelow < menuHeight && spaceAbove > spaceBelow ? "up" : "down";
      const availableSpace = nextPlacement === "up" ? spaceAbove : spaceBelow;
      const visibleHeight = Math.max(80, Math.min(menuHeight, availableSpace));
      const top = nextPlacement === "up"
        ? controlBounds.top - visibleHeight - 6
        : controlBounds.bottom + 6;

      setPlacement(nextPlacement);
      setMenuPosition({
        top: Math.max(viewportPadding, top),
        left: controlBounds.left,
        width: controlBounds.width,
        maxHeight: visibleHeight,
      });
    }

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
  }, [disabled, normalizedOptions.length, open]);

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
      <div className="app-select-control" ref={controlRef}>
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
            className={`app-select-menu is-fixed ${placement === "up" ? "is-up" : "is-down"}`}
            ref={menuRef}
            style={menuPosition || undefined}
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
