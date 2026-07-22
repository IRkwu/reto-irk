import { Icon } from "../AppIcon/AppIcon.jsx";
import "./LoadingState.css";

export default function LoadingState({ text = "Cargando..." }) {
  return (
    <div className="loader">
      <Icon icon="mdi:loading" width={56} height={56} aria-hidden="true" />
      <span className="muted">{text}</span>
    </div>
  );
}
