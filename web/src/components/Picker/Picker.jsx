import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import AssetImage from "../AssetImage/AssetImage.jsx";
import "./Picker.css";

export default function Picker({
  value,
  options,
  placeholder = "Seleccionar",
  onChange,
  icon = "mdi:map-marker-radius-outline",
  iconUrl,
  getIcon,
  variant = "",
  hidePlaceholderOption = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));
  const menuOptions = hidePlaceholderOption
    ? options.filter((option) => option.value !== "" && option.value !== null && option.value !== undefined)
    : options;

  useEffect(() => {
    function handleClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useLayoutEffect(() => {
    if (!open || variant !== "dino-grid" || !rootRef.current) {
      setMenuPosition(null);
      return undefined;
    }

    function updateMenuPosition() {
      const bounds = rootRef.current?.getBoundingClientRect();

      if (!bounds) {
        return;
      }

      const viewportPadding = 12;
      const width = Math.min(560, Math.max(260, window.innerWidth - viewportPadding * 2));
      const desiredHeight = Math.min(368, Math.max(180, Math.round((window.innerHeight - viewportPadding * 2) * 0.8)));
      const centeredLeft = bounds.left + (bounds.width - width) / 2;
      const left = Math.min(
        Math.max(viewportPadding, centeredLeft),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
      );
      const belowTop = bounds.bottom + 6;
      const belowSpace = Math.max(0, window.innerHeight - viewportPadding - belowTop);
      const aboveSpace = Math.max(0, bounds.top - viewportPadding - 6);
      const openAbove = belowSpace < Math.min(desiredHeight, 180) && aboveSpace > belowSpace;
      const availableSpace = openAbove ? aboveSpace : belowSpace;
      const height = Math.max(1, Math.min(desiredHeight, availableSpace));
      const top = openAbove ? bounds.top - height - 6 : belowTop;

      setMenuPosition({
        position: "fixed",
        top,
        left,
        width,
        maxHeight: height,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, options.length, variant]);

  function selectOption(option) {
    if (disabled) {
      return;
    }

    onChange?.(option.value);
    setOpen(false);
    setMenuPosition(null);
  }

  function renderIcon(option, isMenuOption = false) {
    if (getIcon) {
      const customIcon = getIcon(option, { isMenuOption });

      if (customIcon !== undefined) {
        return customIcon;
      }
    }

    const imageUrl = option?.image_url || option?.icon_url || iconUrl;

    if (imageUrl) {
      return (
        <AssetImage
          className="picker-thumb"
          src={imageUrl}
          alt=""
          fallback={<Icon icon={option?.icon || icon} width={18} aria-hidden="true" />}
        />
      );
    }

    return <Icon icon={option?.icon || icon} width={18} aria-hidden="true" />;
  }

  return (
    <div className={`picker ${variant ? `picker-${variant}` : ""}`.trim()} ref={rootRef}>
      <button
        className="picker-button"
        type="button"
        disabled={disabled}
        onClick={() => setOpen((next) => !next)}
        title={`${open ? "Cerrar" : "Abrir"} selector: ${selected?.label || placeholder}`}
        aria-label={`${open ? "Cerrar" : "Abrir"} selector: ${selected?.label || placeholder}`}
      >
        <span className="picker-leading">
          {renderIcon(selected)}
        </span>
        <span className={selected ? "picker-label" : "picker-label muted"}>
          {selected?.label || placeholder}
        </span>
        <Icon icon="mdi:chevron-down" width={18} aria-hidden="true" />
      </button>

      {open && !disabled ? (
        <div className="picker-menu" ref={menuRef} style={menuPosition || undefined}>
          {menuOptions.map((option) => (
            <button
              className={`picker-option ${String(option.value) === String(value) ? "selected" : ""}`}
              key={option.value || "empty"}
              type="button"
              onClick={() => selectOption(option)}
              title={`Seleccionar ${option.label}`}
              aria-label={`Seleccionar ${option.label}`}
            >
              <span className="picker-leading">
                {renderIcon(option, true)}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
