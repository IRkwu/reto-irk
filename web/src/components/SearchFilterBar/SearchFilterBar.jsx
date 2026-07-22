import { Icon } from "../AppIcon/AppIcon.jsx";
import { useI18n } from "../../i18n";
import "./SearchFilterBar.css";

export default function SearchFilterBar({
  value,
  onChange,
  placeholder,
  filters = [],
  selectedFilter,
  onFilterChange,
  clearLabel,
}) {
  const { t } = useI18n();
  const nextPlaceholder = placeholder || t("common.search");
  const nextClearLabel = clearLabel || t("common.clearSearch");

  return (
    <section className="card search-filter-bar">
      <label className="search-filter-field">
        <Icon icon="mdi:magnify" width={18} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={nextPlaceholder}
        />
      </label>
      {value ? (
        <button
          className="btn ghost icon-only search-filter-clear"
          type="button"
          aria-label={nextClearLabel}
          title={nextClearLabel}
          onClick={() => onChange("")}
        >
          <Icon icon="mdi:close" width={20} aria-hidden="true" />
        </button>
      ) : null}
      {filters.length ? (
        <div className="search-filter-actions" aria-label={t("common.filters")}>
          {filters.map((filter) => (
            <button
              className={`btn ghost ${selectedFilter === filter.value ? "selected" : ""}`}
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              title={t("common.filterBy", { label: filter.label })}
              aria-label={t("common.filterBy", { label: filter.label })}
              aria-pressed={selectedFilter === filter.value}
            >
              {filter.mobileLabel ? (
                <>
                  <span className="search-filter-label-full">{filter.label}</span>
                  <span className="search-filter-label-mobile">{filter.mobileLabel}</span>
                </>
              ) : (
                filter.label
              )}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
