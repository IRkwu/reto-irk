import { resolveAssetUrl } from "../../services/apiClient";

export default function PlayerAvatar({ player, className = "player-avatar" }) {
  const name = player?.name || "";
  const iconUrl = resolveAssetUrl(player?.icon_url);

  return (
    <span className={className}>
      {iconUrl ? (
        <img src={iconUrl} alt={name} />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
