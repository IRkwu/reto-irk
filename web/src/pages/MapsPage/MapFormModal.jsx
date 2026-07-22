import { Icon } from "../../components/AppIcon/AppIcon.jsx";

export default function MapFormModal({ mode, selectedMap, modalRef, onClose, onSubmit, t }) {
  if (!mode) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="challenge-modal map-admin-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-modal-title"
        tabIndex={-1}
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <div className="h1" id="map-modal-title">{mode === "edit" ? t("mapsPage.formEditTitle") : t("mapsPage.formCreateTitle")}</div>
            <div className="muted">{t("mapsPage.formDescription")}</div>
          </div>
          <button className="btn ghost icon-only" type="button" onClick={onClose} title={t("mapsPage.closeForm")} aria-label={t("mapsPage.closeForm")}>
            <Icon icon="mdi:close" width={20} aria-hidden="true" />
          </button>
        </div>
        <label className="field-label">
          <span>{t("mapsPage.name")}</span>
          <input name="name" placeholder="The Island" defaultValue={mode === "edit" ? selectedMap?.name : ""} required />
        </label>
        <label className="field-label">
          <span>{t("mapsPage.imageUrl")}</span>
          <input name="image_url" placeholder="https://..." defaultValue={mode === "edit" ? selectedMap?.image_url || "" : ""} />
        </label>
        <div className="modal-actions">
          <button
            className="btn ghost"
            type="button"
            onClick={onClose}
            title={mode === "edit" ? t("mapsPage.cancelEdit") : t("mapsPage.cancelCreate")}
            aria-label={mode === "edit" ? t("mapsPage.cancelEdit") : t("mapsPage.cancelCreate")}
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn"
            type="submit"
            title={mode === "edit" ? t("mapsPage.saveMap") : t("mapsPage.createMap")}
            aria-label={mode === "edit" ? t("mapsPage.saveMap") : t("mapsPage.createMap")}
          >
            <Icon icon={mode === "edit" ? "mdi:content-save-outline" : "mdi:plus"} width={18} aria-hidden="true" />
            {mode === "edit" ? t("common.save") : t("common.create")}
          </button>
        </div>
      </form>
    </div>
  );
}
