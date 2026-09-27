import DinoImage from "../DinoImage/DinoImage.jsx";
import { getDinoImageUrl } from "../../utils/dinoIcons";
import "./DinoTile.css";

export default function DinoTile({ dino, done, busy, disabled, onClick, action, actionLabel }) {
  return (
    <button
      type="button"
      className={`target-tile dino-card ${done ? "done" : ""}`}
      disabled={busy || disabled}
      onClick={onClick}
      title={actionLabel || dino?.name || "Dino"}
      aria-label={actionLabel || dino?.name || "Dino"}
    >
      <div className="tile-imgwrap">
        <DinoImage
          src={dino?.image_url}
          sources={[getDinoImageUrl(dino?.name)]}
          className="tile-img"
          alt={dino?.name || "Dino"}
          fallback={<div className="tile-img ph" />}
        />
      </div>
      <div className="tile-name">{dino?.name || "Dino"}</div>
      {action ? <div className="tile-action">{action}</div> : null}
    </button>
  );
}
