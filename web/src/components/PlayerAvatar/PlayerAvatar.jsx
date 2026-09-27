import AssetImage from "../AssetImage/AssetImage.jsx";

export default function PlayerAvatar({ player, className = "player-avatar" }) {
  const name = player?.name || "";
  return (
    <span className={className}>
      <AssetImage
        src={player?.icon_url}
        alt={name}
        fallback={name.slice(0, 2).toUpperCase()}
      />
    </span>
  );
}
