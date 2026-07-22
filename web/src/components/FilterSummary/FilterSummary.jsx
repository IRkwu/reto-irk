import { Icon } from "../AppIcon/AppIcon.jsx";
import "./FilterSummary.css";

export default function FilterSummary({ items = [], onClear }) {
  const activeItems = items.filter((item) => item.value);

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <div className="filter-summary" aria-label="Filtros activos">
      {activeItems.map((item) => (
        <span className="filter-summary-chip" key={item.label}>
          <b>{item.label}</b>
          {item.value}
        </span>
      ))}
      {onClear ? (
        <button className="filter-summary-clear" type="button" onClick={onClear}>
          <Icon icon="mdi:close" width={15} aria-hidden="true" />
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
