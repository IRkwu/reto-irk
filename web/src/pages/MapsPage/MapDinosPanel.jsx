import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import Picker from "../../components/Picker/Picker.jsx";

export default function MapDinosPanel({
  editMode,
  selectedMapId,
  selectedDinoId,
  dinoOptions,
  mapDinos,
  onSelectedDinoChange,
  onAddDino,
  onRequestRemoveDino,
  t,
}) {
  return (
    <section className="card map-detail-card">
      <div className="card-head">
        <div>
          <div className="h2">{t("mapsPage.mapDinos")}</div>
          <div className="muted">{t("mapsPage.assignedDinos", { count: mapDinos.length })}</div>
        </div>
      </div>
      {editMode ? (
        <div className="map-dino-form">
          <Picker
            value={selectedDinoId}
            options={dinoOptions}
            placeholder={t("mapsPage.selectDino")}
            icon="mdi:dinosaur"
            onChange={onSelectedDinoChange}
          />
          <button className="btn" type="button" disabled={!selectedMapId || !selectedDinoId} onClick={onAddDino} title={t("mapsPage.addDino")} aria-label={t("mapsPage.addDino")}>
            <Icon icon="mdi:plus" width={18} aria-hidden="true" />
            {t("common.add")}
          </button>
        </div>
      ) : null}
      <div className="map-dino-list">
        {mapDinos.map((dino) => (
          <div className={`map-dino-chip ${editMode ? "editable" : ""}`} key={dino.id}>
            {dino.image_url ? <img src={dino.image_url} alt="" /> : <Icon icon="mdi:dinosaur" width={18} aria-hidden="true" />}
            <span>{dino.name}</span>
            {editMode ? (
              <button
                className="map-dino-remove"
                type="button"
                aria-label={t("mapsPage.removeDinoFromMap", { name: dino.name })}
                title={t("mapsPage.removeDinoFromMap", { name: dino.name })}
                onClick={() => onRequestRemoveDino(dino)}
              >
                <Icon icon="mdi:close" width={15} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
