import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import AdminEditBanner from "../../components/AdminEditBanner/AdminEditBanner.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import Layout from "../../components/Layout/Layout.jsx";
import { useNotifications } from "../../components/Notifications";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { useI18n } from "../../i18n";
import { playerService } from "../../services/playerService";
import { shouldConfirmDangerousActions } from "../../utils/settings";
import "./PlayersPage.css";

export default function PlayersPage() {
  const { t } = useI18n();
  const { success } = useNotifications();
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);
  const [playerToDeactivate, setPlayerToDeactivate] = useState(null);
  const [playerToActivate, setPlayerToActivate] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const data = await playerService.list({ limit: 200 });
      setPlayers(data);

      const pairs = await Promise.all(
        data.map(async (player) => [player.id, await playerService.getStats(player.id)])
      );
      setStats(Object.fromEntries(pairs));
    } catch (err) {
      setError(err.message || t("playersPage.loadError"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function savePlayer(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || "").trim(),
      icon_url: String(form.get("icon_url") || "").trim() || null,
      is_active: current?.is_active ?? true,
    };

    if (!payload.name) {
      return;
    }

    try {
      if (editingId) {
        await playerService.update(editingId, payload);
      } else {
        await playerService.create(payload);
      }
      formElement.reset();
      setEditingId(null);
      setModalOpen(false);
      success(editingId ? t("playersPage.playerUpdated") : t("playersPage.playerCreated"));
      await load();
    } catch (err) {
      setError(err.message || t("playersPage.saveError"));
    }
  }

  function requestRemovePlayer(player) {
    if (shouldConfirmDangerousActions()) {
      setPlayerToRemove(player);
      return;
    }

    removePlayer(player);
  }

  async function removePlayer(targetPlayer = playerToRemove) {
    if (!targetPlayer) {
      return;
    }

    try {
      await playerService.remove(targetPlayer.id);
      setPlayerToRemove(null);
      success(t("playersPage.playerDeleted"));
      await load();
    } catch (err) {
      setPlayerToRemove(null);
      setActionError(err.message || t("playersPage.deleteError"));
    }
  }

  async function togglePlayerActive(player) {
    try {
      if (player.is_active) {
        await playerService.deactivate(player.id);
      } else {
        await playerService.activate(player.id);
      }
      success(player.is_active ? t("playersPage.playerDeactivated") : t("playersPage.playerActivated"));
      await load();
    } catch (err) {
      setActionError(err.message || t("playersPage.statusError"));
    }
  }

  function requestTogglePlayerActive(player) {
    if (shouldConfirmDangerousActions()) {
      if (player.is_active) {
        setPlayerToDeactivate(player);
      } else {
        setPlayerToActivate(player);
      }
      return;
    }

    togglePlayerActive(player);
  }

  function getPlayerStatusAction(player) {
    return player.is_active ? t("playersPage.deactivate") : t("playersPage.activate");
  }

  function renderPlayerState(player, className = "") {
    return (
      <span className={`app-badge player-state ${player.is_active ? "active" : "inactive"} ${className}`.trim()}>
        {player.is_active ? t("playersPage.active") : t("playersPage.inactive")}
      </span>
    );
  }

  function formatPercent(value) {
    const nextValue = Number(value ?? 0);
    return `${Number.isFinite(nextValue) ? nextValue.toFixed(1) : "0.0"}%`;
  }

  const current = players.find((player) => player.id === editingId);

  function openCreateModal() {
    setError("");
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(player) {
    setError("");
    setEditingId(player.id);
    setModalOpen(true);
  }

  function closeModal() {
    setEditingId(null);
    setModalOpen(false);
  }

  const playerModalRef = useModalAccessibility(modalOpen, closeModal);

  return (
    <Layout
      title={t("playersPage.title")}
      actions={
        <div className={`players-page-actions ${editMode ? "editing" : ""}`.trim()}>
          <button
            className="btn ghost"
            type="button"
            onClick={() => setEditMode((next) => !next)}
            title={editMode ? t("dinosPage.normalViewTitle") : t("playersPage.editPlayers")}
            aria-label={editMode ? t("dinosPage.normalViewTitle") : t("playersPage.editPlayers")}
          >
            <Icon icon={editMode ? "mdi:eye-outline" : "mdi:pencil-outline"} width={18} aria-hidden="true" />
            {editMode ? t("dinosPage.normalView") : t("common.edit")}
          </button>
          {editMode ? (
            <button className="btn" type="button" onClick={openCreateModal} title={t("playersPage.newPlayer")} aria-label={t("playersPage.newPlayer")}>
              <Icon icon="mdi:plus" width={18} aria-hidden="true" />
              {t("playersPage.newPlayer")}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="players-admin-shell">
        <section className="card players-admin-hero">
          <div className="section-head players-admin-head">
            <div>
              <div className="h1">{t("playersPage.heroTitle")}</div>
              <div className="muted">{t("playersPage.heroText")}</div>
            </div>
            <div className="players-admin-summary">
              <span>{t("playersPage.players")}</span>
              <b>{players.length}</b>
            </div>
          </div>
          {error ? <div className="error-box">{error}</div> : null}
        </section>

        {editMode ? (
          <AdminEditBanner text={t("playersPage.editBanner")} />
        ) : null}

        {busy && players.length === 0 ? <Skeleton variant="players" count={4} /> : null}

        {!busy && players.length === 0 ? (
          <EmptyState
            title={t("playersPage.emptyTitle")}
            text={t("playersPage.emptyText")}
            action={
              <button
                className="btn ghost"
                type="button"
                onClick={editMode ? openCreateModal : () => setEditMode(true)}
              >
                <Icon icon={editMode ? "mdi:plus" : "mdi:pencil-outline"} width={18} aria-hidden="true" />
                {editMode ? t("playersPage.createPlayer") : t("playersPage.activateEdit")}
              </button>
            }
          />
        ) : null}

        {(!busy || players.length > 0) && players.length > 0 ? (
        <div className="players-admin-grid">
          {players.map((player) => {
            const playerStats = stats[player.id] || {};

            return (
              <article className="card player-admin-card" key={player.id}>
                <div className="card-head player-admin-card-head">
                  <div className="player-admin-title">
                    <PlayerAvatar player={player} className="player-admin-avatar" />
                    <div>
                      <div className="player-admin-name-row">
                        <div className="h2">{player.name}</div>
                        {renderPlayerState(player, "variant-inline")}
                      </div>
                    </div>
                  </div>
                  {editMode ? (
                    <div className="player-admin-actions">
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => requestTogglePlayerActive(player)}
                        aria-label={`${getPlayerStatusAction(player)} ${player.name}`}
                        title={`${getPlayerStatusAction(player)} ${player.name}`}
                      >
                        <Icon icon={player.is_active ? "mdi:account-off-outline" : "mdi:account-check-outline"} width={18} aria-hidden="true" />
                      </button>
                      <button className="btn ghost" type="button" onClick={() => openEditModal(player)} aria-label={t("playersPage.editItem", { name: player.name })} title={t("playersPage.editItem", { name: player.name })}>
                        <Icon icon="mdi:pencil-outline" width={18} aria-hidden="true" />
                      </button>
                      <button className="btn danger" type="button" onClick={() => requestRemovePlayer(player)} aria-label={t("playersPage.deleteItem", { name: player.name })} title={t("playersPage.deleteItem", { name: player.name })}>
                        <Icon icon="mdi:trash-can-outline" width={18} aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="metric-row player-stats-row">
                  <div className="metric-mini"><span>{t("playersPage.challenges")}</span><b>{playerStats.challenges_participated ?? 0}</b></div>
                  <div className="metric-mini"><span>{t("playersPage.tamed")}</span><b>{playerStats.dinos_tamed ?? 0}</b></div>
                  <div className="metric-mini"><span>{t("playersPage.notTamed")}</span><b>{playerStats.dinos_not_tamed ?? 0}</b></div>
                  <div className="metric-mini"><span>{t("playersPage.completed")}</span><b>{playerStats.challenges_completed ?? 0}</b></div>
                  <div className="metric-mini"><span>{t("playersPage.tamedPercent")}</span><b>{formatPercent(playerStats.dinos_tamed_percentage)}</b></div>
                  <div className="metric-mini"><span>{t("playersPage.notTamedPercent")}</span><b>{formatPercent(playerStats.dinos_not_tamed_percentage)}</b></div>
                </div>
              </article>
            );
          })}
        </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" onClick={closeModal}>
          <form
            className="challenge-modal player-admin-modal"
            ref={playerModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-modal-title"
            tabIndex={-1}
            onSubmit={savePlayer}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="h1" id="player-modal-title">{editingId ? t("playersPage.formEditTitle") : t("playersPage.formCreateTitle")}</div>
                <div className="muted">{t("playersPage.formDescription")}</div>
              </div>
              <button className="btn ghost icon-only" type="button" onClick={closeModal} title={t("playersPage.closeForm")} aria-label={t("playersPage.closeForm")}>
                <Icon icon="mdi:close" width={20} aria-hidden="true" />
              </button>
            </div>

            <label className="field-label">
              <span>{t("playersPage.name")}</span>
              <input name="name" placeholder="IRkwu" defaultValue={current?.name || ""} key={current?.id || "new"} required />
            </label>
            <label className="field-label">
              <span>{t("playersPage.iconUrl")}</span>
              <input name="icon_url" placeholder="https://..." defaultValue={current?.icon_url || ""} key={`icon-${current?.id || "new"}`} />
            </label>

            <div className="modal-actions">
              <button className="btn ghost" type="button" onClick={closeModal} title={t("common.cancel")} aria-label={t("playersPage.cancelEdit")}>{t("common.cancel")}</button>
              <button className="btn" type="submit" title={editingId ? t("playersPage.savePlayer") : t("playersPage.createPlayerTitle")} aria-label={editingId ? t("playersPage.saveEditPlayer") : t("playersPage.createPlayerTitle")}>
                <Icon icon={editingId ? "mdi:content-save-outline" : "mdi:plus"} width={18} aria-hidden="true" />
                {editingId ? t("common.save") : t("common.create")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(playerToRemove)}
        variant="danger"
        title={t("playersPage.deleteTitle")}
        message={playerToRemove ? t("playersPage.deleteMessage", { name: playerToRemove.name }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={removePlayer}
        onCancel={() => setPlayerToRemove(null)}
      />
      <ConfirmDialog
        open={Boolean(playerToDeactivate)}
        variant="danger"
        title={t("playersPage.deactivateTitle")}
        message={playerToDeactivate ? t("playersPage.deactivateMessage", { name: playerToDeactivate.name }) : ""}
        confirmLabel={t("playersPage.deactivate")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          const targetPlayer = playerToDeactivate;

          setPlayerToDeactivate(null);
          togglePlayerActive(targetPlayer);
        }}
        onCancel={() => setPlayerToDeactivate(null)}
      />
      <ConfirmDialog
        open={Boolean(playerToActivate)}
        title={t("playersPage.activateTitle")}
        message={playerToActivate ? t("playersPage.activateMessage", { name: playerToActivate.name }) : ""}
        confirmLabel={t("playersPage.activate")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          const targetPlayer = playerToActivate;

          setPlayerToActivate(null);
          togglePlayerActive(targetPlayer);
        }}
        onCancel={() => setPlayerToActivate(null)}
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
