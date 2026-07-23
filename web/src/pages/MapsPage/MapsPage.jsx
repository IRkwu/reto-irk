import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import AdminEditBanner from "../../components/AdminEditBanner/AdminEditBanner.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import DashboardWidgets from "../../components/DashboardWidgets/DashboardWidgets.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import GameBadge from "../../components/GameBadge/GameBadge.jsx";
import Layout from "../../components/Layout/Layout.jsx";
import { useNotifications } from "../../components/Notifications";
import SearchFilterBar from "../../components/SearchFilterBar/SearchFilterBar.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { useStaleRequestGuard } from "../../hooks/useStaleRequestGuard";
import { useI18n } from "../../i18n";
import { dinoService } from "../../services/dinoService";
import { mapService, spawnZoneService } from "../../services/mapService";
import { shouldConfirmDangerousActions } from "../../utils/settings";
import { getStoredPageFilters, savePageFilters } from "../../utils/pageFilters";
import MapDinosPanel from "./MapDinosPanel.jsx";
import MapFormModal from "./MapFormModal.jsx";
import SpawnZonesPanel from "./SpawnZonesPanel.jsx";
import "./MapsPage.css";

const gameOptions = [
  {
    value: "ark_survival_evolved",
    label: "Ark Survival Evolved",
    mobileLabel: "Evolved",
  },
  {
    value: "ark_survival_ascended",
    label: "Ark Survival Ascended",
    mobileLabel: "Ascended",
  },
];

export default function MapsPage() {
  const { t } = useI18n();
  const { success } = useNotifications();
  const gameFilters = [
    {
      value: "",
      label: t("filters.games.all"),
    },
    ...gameOptions.map((option) => ({
      ...option,
      mobileLabel: option.value === "ark_survival_evolved"
        ? t("filters.games.evolvedMobile")
        : t("filters.games.ascendedMobile"),
    })),
  ];
  const rememberedFilters = getStoredPageFilters("maps", {
    search: "",
    gameFilter: "",
  });
  const [maps, setMaps] = useState([]);
  const [dinos, setDinos] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState("");
  const [spawnZones, setSpawnZones] = useState([]);
  const [mapDinos, setMapDinos] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [mapModalMode, setMapModalMode] = useState(null);
  const [search, setSearch] = useState(rememberedFilters.search);
  const [searchPending, setSearchPending] = useState(false);
  const [gameFilter, setGameFilter] = useState(rememberedFilters.gameFilter);
  const [selectedDinoId, setSelectedDinoId] = useState("");
  const [dinoToRemove, setDinoToRemove] = useState(null);
  const [mapToRemove, setMapToRemove] = useState(null);
  const [zoneToRemove, setZoneToRemove] = useState(null);
  const [actionError, setActionError] = useState("");
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [zoneForm, setZoneForm] = useState({ name: "" });
  const listRequestGuard = useStaleRequestGuard();
  const detailsRequestGuard = useStaleRequestGuard();
  const mapModalRef = useModalAccessibility(Boolean(mapModalMode), closeMapModal);

  const selectedMap = useMemo(
    () => maps.find((map) => map.id === Number(selectedMapId)),
    [maps, selectedMapId]
  );
  const assignedDinoIds = useMemo(
    () => new Set(mapDinos.map((dino) => dino.id)),
    [mapDinos]
  );
  const availableDinos = useMemo(
    () => dinos.filter((dino) => !assignedDinoIds.has(dino.id)),
    [dinos, assignedDinoIds]
  );
  const dinoOptions = useMemo(
    () =>
      availableDinos.map((dino) => ({
        value: dino.id,
        label: dino.name,
        image_url: dino.image_url,
        icon: "mdi:dinosaur",
      })),
    [availableDinos]
  );
  const mapWidgets = useMemo(
    () => [
      {
        label: t("mapsPage.maps"),
        value: maps.length,
      },
      {
        label: t("mapsPage.zones"),
        value: spawnZones.length,
      },
      {
        label: t("common.dinos"),
        value: mapDinos.length,
      },
    ],
    [mapDinos.length, maps, spawnZones.length, t]
  );
  const load = useCallback(async (searchValue = search) => {
    const requestId = listRequestGuard.nextRequestId();

    setBusy(true);
    setError("");

    try {
      const [mapData, dinoData] = await Promise.all([
        mapService.list({
          limit: 200,
          search: searchValue.trim() || undefined,
          game: gameFilter || undefined,
        }),
        dinoService.list({ limit: 200 }),
      ]);
      if (listRequestGuard.isCurrentRequest(requestId)) {
        setMaps(mapData);
        setDinos(dinoData);
        setSelectedMapId((prev) =>
          mapData.some((map) => map.id === Number(prev)) ? prev : mapData[0]?.id || ""
        );
      }
    } catch (err) {
      if (listRequestGuard.isCurrentRequest(requestId)) {
        setError(err.message || t("mapsPage.loadError"));
      }
    } finally {
      if (listRequestGuard.isCurrentRequest(requestId)) {
        setBusy(false);
        setSearchPending(false);
      }
    }
  }, [gameFilter, listRequestGuard, search, t]);

  const loadMapDetails = useCallback(async (mapId) => {
    const requestId = detailsRequestGuard.nextRequestId();

    if (!mapId) {
      if (detailsRequestGuard.isCurrentRequest(requestId)) {
        setSpawnZones([]);
        setMapDinos([]);
      }
      return;
    }

    try {
      const [zones, assigned] = await Promise.all([
        spawnZoneService.list(mapId, { limit: 200 }),
        dinoService.list({ id_map: mapId, limit: 200 }),
      ]);

      if (detailsRequestGuard.isCurrentRequest(requestId)) {
        setSpawnZones(zones);
        setMapDinos(assigned);
      }
    } catch (err) {
      if (detailsRequestGuard.isCurrentRequest(requestId)) {
        setError(err.message || t("mapsPage.detailsError"));
      }
    }
  }, [detailsRequestGuard, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load(search);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [load, search]);

  useEffect(() => {
    loadMapDetails(selectedMapId);
  }, [loadMapDetails, selectedMapId]);

  useEffect(() => {
    savePageFilters("maps", { search, gameFilter });
  }, [gameFilter, search]);

  useEffect(() => {
    if (!selectedDinoId && dinoOptions.length > 0) {
      setSelectedDinoId(dinoOptions[0].value);
      return;
    }

    if (selectedDinoId && !dinoOptions.some((option) => String(option.value) === String(selectedDinoId))) {
      setSelectedDinoId(dinoOptions[0]?.value || "");
    }
  }, [dinoOptions, selectedDinoId]);

  function openCreateMapModal() {
    setMapModalMode("create");
  }

  function updateSearch(value) {
    setSearchPending(true);
    setSearch(value);
  }

  function updateGameFilter(value) {
    setSearchPending(true);
    setGameFilter(value);
  }

  function openEditMapModal(map = selectedMap) {
    if (map) {
      setSelectedMapId(map.id);
      setMapModalMode("edit");
    }
  }

  function closeMapModal() {
    setMapModalMode(null);
  }

  async function saveMap(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const imageUrl = String(form.get("image_url") || "").trim() || null;

    try {
      if (mapModalMode === "edit" && selectedMap) {
        await mapService.update(selectedMap.id, {
          name,
          image_url: imageUrl,
        });
      } else {
        await mapService.create({
          name,
          image_url: imageUrl,
          is_active: true,
        });
      }
      formElement.reset();
      closeMapModal();
      success(mapModalMode === "edit" ? t("mapsPage.mapUpdated") : t("mapsPage.mapCreated"));
      await load();
    } catch (err) {
      setError(err.message || t("mapsPage.saveMapError"));
    }
  }

  function requestRemoveMap(map) {
    if (shouldConfirmDangerousActions()) {
      setMapToRemove(map);
      return;
    }

    removeMap(map);
  }

  async function removeMap(targetMap = mapToRemove) {
    if (!targetMap) {
      return;
    }

    try {
      await mapService.remove(targetMap.id);
      setMapToRemove(null);
      setSelectedMapId("");
      success(t("mapsPage.mapDeleted"));
      await load();
    } catch (err) {
      setActionError(err.message || t("mapsPage.deleteMapError"));
    }
  }

  async function createZone(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    try {
      await spawnZoneService.create(selectedMapId, {
        name: form.get("name"),
        is_active: true,
      });
      formElement.reset();
      success(t("mapsPage.zoneCreated"));
      await loadMapDetails(selectedMapId);
    } catch (err) {
      setError(err.message || t("mapsPage.createZoneError"));
    }
  }

  function startEditZone(zone) {
    setEditingZoneId(zone.id);
    setZoneForm({
      name: zone.name,
    });
  }

  async function updateZone(event) {
    event.preventDefault();
    if (!selectedMapId || !editingZoneId) {
      return;
    }

    try {
      await spawnZoneService.update(selectedMapId, editingZoneId, {
        name: zoneForm.name,
      });
      setEditingZoneId(null);
      setZoneForm({ name: "" });
      success(t("mapsPage.zoneUpdated"));
      await loadMapDetails(selectedMapId);
    } catch (err) {
      setError(err.message || t("mapsPage.saveZoneError"));
    }
  }

  function requestRemoveZone(zone) {
    if (shouldConfirmDangerousActions()) {
      setZoneToRemove(zone);
      return;
    }

    removeZone(zone);
  }

  async function removeZone(targetZone = zoneToRemove) {
    if (!selectedMapId || !targetZone) {
      return;
    }

    try {
      await spawnZoneService.remove(selectedMapId, targetZone.id);
      setZoneToRemove(null);
      if (editingZoneId === targetZone.id) {
        setEditingZoneId(null);
      }
      success(t("mapsPage.zoneDeleted"));
      await loadMapDetails(selectedMapId);
    } catch (err) {
      setActionError(err.message || t("mapsPage.deleteZoneError"));
    }
  }

  async function addDino() {
    if (!selectedMapId || !selectedDinoId) {
      return;
    }
    
    try {
      await mapService.addDino(selectedMapId, selectedDinoId);
      success(t("mapsPage.addDinoNotice"));
      await loadMapDetails(selectedMapId);
    } catch (err) {
      setError(err.message || t("mapsPage.addDinoError"));
    }
  }

  function requestRemoveDino(dino) {
    if (shouldConfirmDangerousActions()) {
      setDinoToRemove(dino);
      return;
    }

    removeDino(dino);
  }

  async function removeDino(targetDino = dinoToRemove) {
    if (!targetDino) {
      return;
    }

    try {
      await mapService.removeDino(selectedMapId, targetDino.id);
      setDinoToRemove(null);
      success(t("mapsPage.removeDinoNotice"));
      await loadMapDetails(selectedMapId);
    } catch (err) {
      setActionError(err.message || t("mapsPage.removeDinoError"));
    }
  }

  return (
    <Layout
      title={t("mapsPage.title")}
      actions={
        <div className={`maps-page-actions ${editMode ? "editing" : ""}`.trim()}>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setEditMode((next) => !next);
              setEditingZoneId(null);
            }}
            title={editMode ? t("dinosPage.normalViewTitle") : t("mapsPage.editMaps")}
            aria-label={editMode ? t("dinosPage.normalViewTitle") : t("mapsPage.editMaps")}
          >
            <Icon icon={editMode ? "mdi:eye-outline" : "mdi:pencil-outline"} width={18} aria-hidden="true" />
            {editMode ? t("dinosPage.normalView") : t("common.edit")}
          </button>
          {editMode ? (
            <>
              <button className="btn" type="button" onClick={openCreateMapModal} title={t("mapsPage.newMap")} aria-label={t("mapsPage.newMap")}>
                <Icon icon="mdi:plus" width={18} aria-hidden="true" />
                {t("mapsPage.newMap")}
              </button>
            </>
          ) : null}
        </div>
      }
    >
      <div className={`maps-admin-shell ${editMode ? "editing" : ""}`.trim()}>
        <section className="card maps-admin-hero">
          <div className="section-head maps-admin-head">
            <div>
              <div className="h1">{t("mapsPage.heroTitle")}</div>
              <div className="muted">
                {editMode
                  ? t("mapsPage.heroEditText")
                  : t("mapsPage.heroText")}
              </div>
            </div>
            <DashboardWidgets items={mapWidgets} />
          </div>
          {error ? <div className="error-box">{error}</div> : null}
        </section>

        {editMode ? (
          <AdminEditBanner text={t("mapsPage.editBanner")} />
        ) : null}

        <SearchFilterBar
          value={search}
          onChange={updateSearch}
          placeholder={t("mapsPage.searchPlaceholder")}
          filters={gameFilters}
          selectedFilter={gameFilter}
          onFilterChange={updateGameFilter}
        />

        {busy && maps.length === 0 ? <Skeleton variant="maps" count={7} /> : null}

        {!busy && !searchPending && maps.length === 0 && !search.trim() && !gameFilter ? (
          <EmptyState
            title={t("mapsPage.emptyTitle")}
            text={t("mapsPage.emptyText")}
            action={
              <button className="btn ghost" type="button" onClick={openCreateMapModal}>
                <Icon icon="mdi:plus" width={18} aria-hidden="true" />
                {t("mapsPage.createMap")}
              </button>
            }
          />
        ) : null}

        {!busy && !searchPending && maps.length === 0 && (search.trim() || gameFilter) ? (
          <EmptyState title={t("common.noResults")} text={t("mapsPage.noResultsText")} />
        ) : null}

        {(!busy || maps.length > 0) && maps.length > 0 ? (
        <section className="maps-card-section">
          <div className="maps-card-grid" role="radiogroup" aria-label={t("mapsPage.selectMapHelp")}>
            {maps.map((map) => (
              <article
                className={`map-admin-card ${Number(selectedMapId) === map.id ? "selected" : ""}`}
                key={map.id}
              >
                <button
                  className="map-admin-select"
                  type="button"
                  onClick={() => setSelectedMapId(map.id)}
                  title={t("mapsPage.selectMap", { name: map.name })}
                  aria-label={t("mapsPage.selectMap", { name: map.name })}
                  role="radio"
                  aria-checked={Number(selectedMapId) === map.id}
                >
                  {map.image_url ? (
                    <img src={map.image_url} alt={map.name} />
                  ) : (
                    <span className="map-admin-fallback">
                      <Icon icon="mdi:map" width={34} aria-hidden="true" />
                    </span>
                  )}
                  <span className="map-admin-name">{map.name}</span>
                  <GameBadge game={map.game} className="map-admin-game" />
                </button>
                {editMode ? (
                  <div className="map-admin-actions">
                    <button
                      className="btn ghost icon-only"
                      type="button"
                      onClick={() => openEditMapModal(map)}
                      title={t("mapsPage.editMap")}
                      aria-label={t("mapsPage.editMap")}
                    >
                      <Icon icon="mdi:pencil-outline" width={17} aria-hidden="true" />
                    </button>
                    <button
                      className="btn danger icon-only"
                      type="button"
                      onClick={() => requestRemoveMap(map)}
                      title={t("mapsPage.deleteMap")}
                      aria-label={t("mapsPage.deleteMap")}
                    >
                      <Icon icon="mdi:trash-can-outline" width={17} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
        ) : null}

        {!busy || maps.length > 0 ? (
          <div className="maps-detail-grid">
            <SpawnZonesPanel
              editMode={editMode}
              selectedMap={selectedMap}
              selectedMapId={selectedMapId}
              spawnZones={spawnZones}
              editingZoneId={editingZoneId}
              zoneForm={zoneForm}
              onCreateZone={createZone}
              onUpdateZone={updateZone}
              onZoneNameChange={(name) => setZoneForm((prev) => ({ ...prev, name }))}
              onCancelEditZone={() => setEditingZoneId(null)}
              onStartEditZone={startEditZone}
              onRequestRemoveZone={requestRemoveZone}
              t={t}
            />
            <MapDinosPanel
              editMode={editMode}
              selectedMapId={selectedMapId}
              selectedDinoId={selectedDinoId}
              dinoOptions={dinoOptions}
              mapDinos={mapDinos}
              onSelectedDinoChange={setSelectedDinoId}
              onAddDino={addDino}
              onRequestRemoveDino={requestRemoveDino}
              t={t}
            />
          </div>
        ) : null}
      </div>

      <MapFormModal
        mode={mapModalMode}
        selectedMap={selectedMap}
        modalRef={mapModalRef}
        onClose={closeMapModal}
        onSubmit={saveMap}
        t={t}
      />

      <ConfirmDialog
        open={Boolean(dinoToRemove)}
        variant="danger"
        title={t("mapsPage.removeDinoTitle")}
        message={dinoToRemove ? t("mapsPage.removeDinoMessage", { dino: dinoToRemove.name, map: selectedMap?.name || t("common.map") }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={removeDino}
        onCancel={() => setDinoToRemove(null)}
      />
      <ConfirmDialog
        open={Boolean(mapToRemove)}
        variant="danger"
        title={t("mapsPage.deleteMapTitle")}
        message={mapToRemove ? t("mapsPage.deleteMapMessage", { name: mapToRemove.name }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={removeMap}
        onCancel={() => setMapToRemove(null)}
      />
      <ConfirmDialog
        open={Boolean(zoneToRemove)}
        variant="danger"
        title={t("mapsPage.deleteZoneTitle")}
        message={zoneToRemove ? t("mapsPage.deleteZoneMessage", { name: zoneToRemove.name }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={removeZone}
        onCancel={() => setZoneToRemove(null)}
      />
      <ConfirmDialog
        open={Boolean(actionError)}
        title={t("common.confirmAction")}
        message={actionError}
        confirmLabel={t("common.accept")}
        cancelLabel={null}
        onConfirm={() => setActionError("")}
        onCancel={() => setActionError("")}
      />
    </Layout>
  );
}
