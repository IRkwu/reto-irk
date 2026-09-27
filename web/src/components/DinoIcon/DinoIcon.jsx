import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import { getDinoIconUrl } from "../../utils/dinoIcons";
import "./DinoIcon.css";

export default function DinoIcon({ dino, imageClassName = "", iconClassName = "", fallbackImageUrl = "" }) {
  const localIconUrl = getDinoIconUrl(dino?.name || dino?.label);
  const imageSources = useMemo(
    () => [localIconUrl, dino?.image_url, dino?.icon_url, fallbackImageUrl]
      .filter(Boolean)
      .filter((url, index, sources) => sources.indexOf(url) === index),
    [dino?.icon_url, dino?.image_url, fallbackImageUrl, localIconUrl]
  );
  const sourceKey = JSON.stringify(imageSources);
  const [failureState, setFailureState] = useState({ sourceKey: "", count: 0 });
  const failedSources = failureState.sourceKey === sourceKey ? failureState.count : 0;
  const imageUrl = imageSources[failedSources];
  const isMaskImage = Boolean(imageUrl && (imageUrl === localIconUrl || imageUrl === fallbackImageUrl));
  const currentSourceRef = useRef({ sourceKey, imageUrl });

  useLayoutEffect(() => {
    currentSourceRef.current = { sourceKey, imageUrl };
  }, [imageUrl, sourceKey]);

  const advanceFailedSources = useCallback((failedSourceKey, failedUrl) => {
    const currentSource = currentSourceRef.current;
    if (currentSource.sourceKey !== failedSourceKey || currentSource.imageUrl !== failedUrl) {
      return;
    }

    setFailureState((current) => ({
      sourceKey: failedSourceKey,
      count: (current.sourceKey === failedSourceKey ? current.count : 0) + 1,
    }));
  }, []);

  useEffect(() => {
    if (!isMaskImage || !imageUrl) {
      return undefined;
    }

    let active = true;
    const probe = new Image();
    probe.onerror = () => {
      if (active) {
        advanceFailedSources(sourceKey, imageUrl);
      }
    };
    probe.src = imageUrl;

    return () => {
      active = false;
      probe.onload = null;
      probe.onerror = null;
      probe.removeAttribute("src");
    };
  }, [advanceFailedSources, imageUrl, isMaskImage, sourceKey]);

  if (isMaskImage) {
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
        onError={() => advanceFailedSources(sourceKey, imageUrl)}
      />
    );
  }

  return (
    <span className={`dino-icon-fallback ${iconClassName}`.trim()}>
      <Icon icon="mdi:dinosaur" width={18} aria-hidden="true" />
    </span>
  );
}
