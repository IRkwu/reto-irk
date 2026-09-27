import { useState } from "react";
import { resolveAssetUrl } from "../../services/apiClient";

function ImageAttempt({ candidates, fallback, ariaHidden, ...imageProps }) {
  const [index, setIndex] = useState(0);
  const source = candidates[index];
  if (!source) return fallback;

  return (
    <img
      {...imageProps}
      key={source}
      src={source}
      aria-hidden={ariaHidden}
      onError={() => setIndex((current) => current === index ? current + 1 : current)}
    />
  );
}

export default function AssetImage({ src, sources = [], fallback = null, ...imageProps }) {
  const candidates = [...new Set([src, ...sources]
    .filter((source) => typeof source === "string" && source.trim())
    .map(resolveAssetUrl)
    .filter(Boolean))];

  return <ImageAttempt key={JSON.stringify(candidates)} candidates={candidates} fallback={fallback} {...imageProps} />;
}
