export const DINO_PICKER_FALLBACK_URL = "/assets/icons/dino_picker_icon.webp";

function normalizeDinoName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getDinoIconUrl(name) {
  const slug = normalizeDinoName(name);
  return slug ? `/assets/dinos_icons/${slug}.webp` : null;
}

export function getDinoImageUrl(name) {
  const slug = normalizeDinoName(name);
  return slug ? `/assets/dinos/${slug}.webp` : null;
}
