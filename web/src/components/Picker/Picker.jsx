import { useEffect, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import "./Picker.css";

export default function Picker({
  value,
  options,
  placeholder = "Seleccionar",
  onChange,
  icon = "mdi:map-marker-radius-outline",
  iconUrl,
  getIcon,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    function handleClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectOption(option) {
    if (disabled) {
      return;
    }

    onChange?.(option.value);
    setOpen(false);
  }

  function renderIcon(option) {
    if (getIcon) {
      return getIcon(option);
    }

    const imageUrl = option?.image_url || option?.icon_url || iconUrl;

    if (imageUrl) {
      return <img className="picker-thumb" src={imageUrl} alt="" />;
    }

    return <Icon icon={option?.icon || icon} width={18} aria-hidden="true" />;
  }

  return (
    <div className="picker" ref={rootRef}>
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
        <div className="picker-menu">
          {options.map((option) => (
            <button
              className={`picker-option ${String(option.value) === String(value) ? "selected" : ""}`}
              key={option.value || "empty"}
              type="button"
              onClick={() => selectOption(option)}
              title={`Seleccionar ${option.label}`}
              aria-label={`Seleccionar ${option.label}`}
            >
              <span className="picker-leading">
                {renderIcon(option)}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
