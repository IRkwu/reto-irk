import { useEffect, useMemo, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import { getDinoIconUrl } from "../../utils/dinoIcons";
import "./DinoIcon.css";

export default function DinoIcon({ dino, imageClassName = "", iconClassName = "", fallbackImageUrl = "" }) {
  const [failedSources, setFailedSources] = useState(0);
  const localIconUrl = getDinoIconUrl(dino?.name || dino?.label);
  const imageSources = useMemo(
    () => [localIconUrl, dino?.image_url, dino?.icon_url].filter(Boolean).filter((url, index, sources) => sources.indexOf(url) === index),
    [dino?.icon_url, dino?.image_url, localIconUrl]
  );

  useEffect(() => {
    setFailedSources(0);
  }, [dino?.id, dino?.label, dino?.name, dino?.image_url, dino?.icon_url]);

  const imageUrl = imageSources[failedSources];
  const isLocalIcon = Boolean(imageUrl && localIconUrl && imageUrl === localIconUrl);

  if (isLocalIcon) {
    return (
      <span
        className={`${imageClassName} dino-local-icon ${iconClassName}`.trim()}
        style={{ "--dino-icon-url": `url("${imageUrl}")` }}
        aria-hidden="true"
      />
    );
  }

  if (imageUrl) {
    return (
      <img
        className={imageClassName}
        src={imageUrl}
        alt=""
        onError={() => setFailedSources((current) => current + 1)}
      />
    );
  }

  if (fallbackImageUrl) {
    return (
      <span
        className={`${imageClassName} dino-local-icon ${iconClassName}`.trim()}
        style={{ "--dino-icon-url": `url("${fallbackImageUrl}")` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span className={`dino-icon-fallback ${iconClassName}`.trim()}>
      <Icon icon="mdi:dinosaur" width={18} aria-hidden="true" />
    </span>
  );
}
