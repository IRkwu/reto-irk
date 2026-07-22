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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
