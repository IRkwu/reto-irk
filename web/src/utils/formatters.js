export const STATUS_LABELS = {
  draft: "Borrador",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Sin estado";
}

export function indexById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

export function formatEventDate(value) {
  if (!value) {
    return "";
  }

  const date = parseEventDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hasTime = typeof value !== "string" || /T|\s\d{2}:\d{2}/.test(value);
  return new Intl.DateTimeFormat("es", hasTime
    ? { dateStyle: "short", timeStyle: "short" }
    : { dateStyle: "short" }
  ).format(date);
}

export function parseEventDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}
