import "./GameBadge.css";
import { GAME_FULL_LABELS, getGameLabel } from "../../utils/gameLabels";

export default function GameBadge({ game, className = "" }) {
  return (
    <span
      className={`app-badge game-badge ${game || ""} ${className}`.trim()}
      title={GAME_FULL_LABELS[game] || game}
    >
      {getGameLabel(game, game)}
    </span>
  );
}
