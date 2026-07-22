import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import ChallengeCard from "../../components/ChallengeCard/ChallengeCard.jsx";
import DashboardWidgets from "../../components/DashboardWidgets/DashboardWidgets.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import GameBadge from "../../components/GameBadge/GameBadge.jsx";
import Layout from "../../components/Layout/Layout.jsx";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar.jsx";
import SearchFilterBar from "../../components/SearchFilterBar/SearchFilterBar.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { useI18n } from "../../i18n";
import {
  challengePlayerService,
  challengeService,
} from "../../services/challengeService";
import { mapService } from "../../services/mapService";
import { playerService } from "../../services/playerService";
import { indexById } from "../../utils/formatters";
import { getStoredPageFilters, savePageFilters } from "../../utils/pageFilters";
import "./ChallengesPage.css";

export default function ChallengesPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const rememberedFilters = getStoredPageFilters("challenges", {
    searchTerm: "",
    statusFilter: "all",
  });
  const statusFilters = [
    { value: "all", label: t("challenges.filters.all") },
    { value: "active", label: t("challenges.filters.active") },
    { value: "draft", label: t("challenges.filters.draft") },
    { value: "completed", label: t("challenges.filters.completed") },
    { value: "cancelled", label: t("challenges.filters.cancelled") },
  ];
  const [challenges, setChallenges] = useState([]);
  const [maps, setMaps] = useState([]);
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(rememberedFilters.searchTerm);
  const [statusFilter, setStatusFilter] = useState(rememberedFilters.statusFilter);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    mapId: "",
    playerIds: [],
  });

  const mapsById = useMemo(() => indexById(maps), [maps]);
  const visibleChallenges = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return challenges.filter((challenge) => {
      const matchesSearch = challenge.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" || challenge.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [challenges, searchTerm, statusFilter]);
  const selectedPlayerCount = draft.playerIds.length;
  const closeCreateModal = useCallback(() => {
    if (!creating) {
      setModalOpen(false);
    }
  }, [creating]);
  const createModalRef = useModalAccessibility(modalOpen, closeCreateModal);
  const activePlayers = useMemo(
    () => players.filter((player) => player.is_active),
    [players]
  );
  const challengeWidgets = useMemo(
    () => [
      {
        label: t("challenges.stats.total"),
        value: challenges.length,
      },
      {
        label: t("challenges.stats.active"),
        value: challenges.filter((challenge) => challenge.status === "active").length,
      },
      {
        label: t("challenges.stats.completed"),
        value: challenges.filter((challenge) => challenge.status === "completed").length,
      },
    ],
    [challenges, t]
  );

  async function load() {
    setBusy(true);
    setError("");

    try {
      const [challengeData, mapData, playerData] = await Promise.all([
        challengeService.list({ limit: 200 }),
        mapService.list({ limit: 200 }),
        playerService.list({ limit: 200, is_active: true }),
      ]);
      setChallenges(challengeData);
      setMaps(mapData);
      setPlayers(playerData);
      setDraft((prev) => ({
        ...prev,
        mapId: prev.mapId || mapData[0]?.id || "",
      }));
    } catch (err) {
      setError(err.message || "Error al cargar retos");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    savePageFilters("challenges", { searchTerm, statusFilter });
  }, [searchTerm, statusFilter]);

  function openCreateModal() {
    setError("");
    setDraft((prev) => ({
      ...prev,
      name: prev.name || `Reto ${challenges.length + 1}`,
      mapId: prev.mapId || maps[0]?.id || "",
      playerIds: prev.playerIds.slice(0, 4),
    }));
    setModalOpen(true);
  }

  function togglePlayer(playerId) {
    setDraft((prev) => {
      const exists = prev.playerIds.includes(playerId);

      if (exists) {
        return {
          ...prev,
          playerIds: prev.playerIds.filter((id) => id !== playerId),
        };
      }

      if (prev.playerIds.length >= 4) {
        return prev;
      }

      return {
        ...prev,
        playerIds: [...prev.playerIds, playerId],
      };
    });
  }

  async function createChallenge() {
    const mapId = Number(draft.mapId);

    if (!mapId) {
      setError(t("challenges.modal.noMapError"));
      return;
    }

    if (draft.playerIds.length < 1 || draft.playerIds.length > 4) {
      setError(t("challenges.modal.playerCountError"));
      return;
    }

    setCreating(true);

    try {
      const challenge = await challengeService.create({
        name: draft.name,
        map_id: mapId,
        player_count: draft.playerIds.length,
      });

      await Promise.all(
        draft.playerIds.map((playerId, index) =>
          challengePlayerService.create(challenge.id, {
            player_id: playerId,
            position: index + 1,
            is_active: true,
          })
        )
      );

      navigate(`/challenges/${challenge.id}/edit`);
    } catch (err) {
      setError(err.message || t("challenges.modal.createError"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Layout
      title={t("challenges.title")}
      actions={
        <div className="challenge-page-actions">
          <button
            className="btn"
            onClick={openCreateModal}
            title={t("challenges.newChallenge")}
            aria-label={t("challenges.newChallenge")}
          >
            <Icon icon="mdi:plus" width={18} aria-hidden="true" />
            {t("challenges.newChallenge")}
          </button>
        </div>
      }
    >
      <div className="challenges-shell">
        <section className="card challenge-page-hero">
          <div className="section-head challenge-page-head">
            <div>
              <div className="h1">{t("challenges.heroTitle")}</div>
              <div className="muted">{t("challenges.heroText")}</div>
            </div>
            <DashboardWidgets items={challengeWidgets} />
          </div>

          {error ? <div className="error-box">{error}</div> : null}
        </section>

        <SearchFilterBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t("challenges.searchPlaceholder")}
          filters={statusFilters}
          selectedFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {busy && challenges.length === 0 ? <Skeleton variant="cards" count={6} /> : null}

        {!busy && challenges.length === 0 ? (
          <EmptyState
            title={t("challenges.emptyTitle")}
            text={t("challenges.emptyText")}
            action={
              <button className="btn ghost" type="button" onClick={openCreateModal}>
                <Icon icon="mdi:plus" width={18} aria-hidden="true" />
                {t("challenges.createChallenge")}
              </button>
            }
          />
        ) : null}

        {!busy && challenges.length > 0 && visibleChallenges.length === 0 ? (
          <EmptyState title={t("common.noResults")} text={t("challenges.noResultsText")} />
        ) : null}

        {!busy || challenges.length > 0 ? (
          <div className="challenge-card-grid">
            {visibleChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                mapName={mapsById.get(challenge.map_id)?.name}
              />
            ))}
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" onClick={closeCreateModal}>
          <div
            className="challenge-modal"
            ref={createModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-challenge-title"
            aria-describedby="create-challenge-description"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="h1" id="create-challenge-title">{t("challenges.modal.title")}</div>
                <div className="muted" id="create-challenge-description">{t("challenges.modal.description")}</div>
              </div>
              <button className="btn ghost icon-only" onClick={() => setModalOpen(false)} disabled={creating} title={t("common.cancel")} aria-label={t("challenges.modal.close")}>
                <Icon icon="mdi:close" width={20} aria-hidden="true" />
              </button>
            </div>

            <section className="challenge-modal-section">
            <label className="field-label">
              <span>{t("challenges.modal.name")}</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                placeholder={t("challenges.modal.namePlaceholder")}
              />
            </label>
            </section>

            <section className="challenge-modal-section">
              <div className="modal-step-title">{t("challenges.modal.map")}</div>
              <div className="map-card-grid" role="radiogroup" aria-label={t("challenges.modal.map")}>
                {maps.map((map) => (
                  <button
                    className={`map-choice-card ${Number(draft.mapId) === map.id ? "selected" : ""}`}
                    key={map.id}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, mapId: map.id }))}
                    title={t("challenges.modal.selectMap", { name: map.name })}
                    aria-label={t("challenges.modal.selectMap", { name: map.name })}
                    role="radio"
                    aria-checked={Number(draft.mapId) === map.id}
                  >
                    {map.image_url ? (
                      <img src={map.image_url} alt={map.name} />
                    ) : (
                      <div className="map-card-fallback">
                        <Icon icon="mdi:map" width={34} aria-hidden="true" />
                      </div>
                    )}
                    <span>{map.name}</span>
                    <GameBadge game={map.game} className="map-choice-game" />
                  </button>
                ))}
              </div>
            </section>

            <section className="challenge-modal-section player-count-card">
              <div>
                <div className="modal-step-title">{t("challenges.modal.players")}</div>
                <div className="muted">{t("challenges.modal.playerHelp", { count: selectedPlayerCount || 0 })}</div>
              </div>
              <div className="player-count-pill">{selectedPlayerCount}/4</div>
            </section>

            <section className="challenge-modal-section">
              <div className="modal-step-title">{t("challenges.modal.selectedPlayers")}</div>
              <div className="player-choice-grid" role="group" aria-label={t("challenges.modal.selectedPlayers")}>
                {activePlayers.map((player) => {
                  const selected = draft.playerIds.includes(player.id);
                  const disabled = !selected && draft.playerIds.length >= 4;
                  const playerLabel = selected
                    ? t("challenges.modal.removePlayer", { name: player.name })
                    : t("challenges.modal.selectPlayer", { name: player.name });

                  return (
                    <button
                      className={`player-choice-card ${selected ? "selected" : ""}`}
                      key={player.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => togglePlayer(player.id)}
                      title={playerLabel}
                      aria-label={playerLabel}
                      aria-pressed={selected}
                    >
                      <PlayerAvatar player={player} className="player-choice-avatar" />
                      <b>{player.name}</b>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setModalOpen(false)} disabled={creating} title={t("common.cancel")} aria-label={t("challenges.modal.close")}>
                {t("common.cancel")}
              </button>
              <button className="btn" onClick={createChallenge} disabled={creating || selectedPlayerCount < 1} title={t("challenges.createChallenge")} aria-label={t("challenges.createChallenge")}>
                {creating ? t("challenges.modal.creating") : t("challenges.createChallenge")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
