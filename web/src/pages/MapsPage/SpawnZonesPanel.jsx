import { Icon } from "../../components/AppIcon/AppIcon.jsx";

export default function SpawnZonesPanel({
  editMode,
  selectedMap,
  selectedMapId,
  spawnZones,
  editingZoneId,
  zoneForm,
  onCreateZone,
  onUpdateZone,
  onZoneNameChange,
  onCancelEditZone,
  onStartEditZone,
  onRequestRemoveZone,
  t,
}) {
  return (
    <section className="card map-detail-card">
      <div className="card-head">
        <div>
          <div className="h2">{t("mapsPage.spawnZones")}</div>
          <div className="muted">{selectedMap?.name || t("mapsPage.selectMapHelp")}</div>
        </div>
      </div>
      {editMode ? (
        <form className="map-zone-form" onSubmit={onCreateZone}>
          <input name="name" placeholder={t("mapsPage.zonePlaceholder")} required disabled={!selectedMapId} />
          <button className="btn" disabled={!selectedMapId} title={t("mapsPage.createZone")} aria-label={t("mapsPage.createZone")}>
            <Icon icon="mdi:plus" width={18} aria-hidden="true" />
            {t("mapsPage.createZone")}
          </button>
        </form>
      ) : null}
      <div className="map-zone-list">
        {spawnZones.map((zone) => (
          <div className="map-zone-row" key={zone.id}>
            {editMode && editingZoneId === zone.id ? (
              <form className="map-zone-edit-form" onSubmit={onUpdateZone}>
                <input
                  value={zoneForm.name}
                  onChange={(event) => onZoneNameChange(event.target.value)}
                  placeholder={t("mapsPage.zonePlaceholder")}
                  required
                />
                <div className="map-zone-edit-actions">
                  <button className="btn" type="submit" title={t("mapsPage.saveZone")} aria-label={t("mapsPage.saveZone")}>
                    <Icon icon="mdi:content-save-outline" width={18} aria-hidden="true" />
                    {t("common.save")}
                  </button>
                  <button className="btn ghost icon-only" type="button" onClick={onCancelEditZone} title={t("mapsPage.cancelZoneEdit")} aria-label={t("mapsPage.cancelZoneEdit")}>
                    <Icon icon="mdi:close" width={18} aria-hidden="true" />
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div>
                  <b>{zone.name}</b>
                </div>
                {editMode ? (
                  <div className="map-zone-row-actions">
                    <button className="btn ghost icon-only" type="button" onClick={() => onStartEditZone(zone)} title={t("mapsPage.editZone", { name: zone.name })} aria-label={t("mapsPage.editZone", { name: zone.name })}>
                      <Icon icon="mdi:pencil-outline" width={18} aria-hidden="true" />
                    </button>
                    <button className="btn danger icon-only" type="button" onClick={() => onRequestRemoveZone(zone)} title={t("mapsPage.deleteZone", { name: zone.name })} aria-label={t("mapsPage.deleteZone", { name: zone.name })}>
                      <Icon icon="mdi:trash-can-outline" width={18} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
