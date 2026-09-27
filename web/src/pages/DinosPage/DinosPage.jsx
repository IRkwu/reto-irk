import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import AssetImage from "../../components/AssetImage/AssetImage.jsx";
import AdminEditBanner from "../../components/AdminEditBanner/AdminEditBanner.jsx";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import DashboardWidgets from "../../components/DashboardWidgets/DashboardWidgets.jsx";
import DinoImage from "../../components/DinoImage/DinoImage.jsx";
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
import { getDinoImageUrl } from "../../utils/dinoIcons";
import { shouldConfirmDangerousActions } from "../../utils/settings";
import { getStoredPageFilters, savePageFilters } from "../../utils/pageFilters";
import "./DinosPage.css";

const gameOptions = [
  {
    value: "ark_survival_evolved",
    label: "Ark Survival Evolved",
    mobileLabel: "Evolved",
    icon_url: "/assets/icons/evolved.webp",
  },
  {
    value: "ark_survival_ascended",
    label: "Ark Survival Ascended",
    mobileLabel: "Ascended",
    icon_url: "/assets/icons/ascended.webp",
  },
];

const emptyForm = {
  name: "",
  image_url: "",
  game: "ark_survival_evolved",
};

export default function DinosPage() {
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
  const rememberedFilters = getStoredPageFilters("dinos", {
    search: "",
    gameFilter: "",
  });
  const [dinos, setDinos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState(rememberedFilters.search);
  const [searchPending, setSearchPending] = useState(false);
  const [gameFilter, setGameFilter] = useState(rememberedFilters.gameFilter);
  const [dinoToRemove, setDinoToRemove] = useState(null);
  const { nextRequestId, isCurrentRequest } = useStaleRequestGuard();
  const dinoModalRef = useModalAccessibility(modalOpen, closeModal);
  const filteredDinos = useMemo(
    () => dinos.filter((dino) => !gameFilter || dino.game === gameFilter),
    [dinos, gameFilter]
  );
  const dinoWidgets = useMemo(
    () => [
      {
        label: t("common.total"),
        value: dinos.length,
      },
      {
        label: "Evolved",
        value: dinos.filter((dino) => dino.game === "ark_survival_evolved").length,
      },
      {
        label: "Ascended",
        value: dinos.filter((dino) => dino.game === "ark_survival_ascended").length,
      },
    ],
    [dinos, t]
  );

  const load = useCallback(async (searchValue = search) => {
    const requestId = nextRequestId();

    setBusy(true);
    setError("");

    try {
      const nextDinos = await dinoService.list({
        limit: 200,
        search: searchValue.trim() || undefined,
      });

      if (isCurrentRequest(requestId)) {
        setDinos(nextDinos);
      }
    } catch (err) {
      if (isCurrentRequest(requestId)) {
        setError(err.message || t("dinosPage.loadError"));
      }
    } finally {
      if (isCurrentRequest(requestId)) {
        setBusy(false);
        setSearchPending(false);
      }
    }
  }, [isCurrentRequest, nextRequestId, search, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      load(search);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [load, search]);

  useEffect(() => {
    savePageFilters("dinos", { search, gameFilter });
  }, [gameFilter, search]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateSearch(value) {
    setSearchPending(true);
    setSearch(value);
  }

  function updateGameFilter(value) {
    setGameFilter(value);
  }

  async function save(event) {
    event.preventDefault();
    const payload = {
      ...form,
      image_url: form.image_url || null,
    };

    try {
      if (editingId) {
        await dinoService.update(editingId, payload);
      } else {
        await dinoService.create(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setModalOpen(false);
      success(editingId ? t("dinosPage.savedEdit") : t("dinosPage.savedCreate"));
      await load();
    } catch (err) {
      setError(err.message || t("dinosPage.saveError"));
    }
  }

  function openCreateModal() {
    setError("");
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function edit(dino) {
    setEditingId(dino.id);
    setForm({
      name: dino.name,
      image_url: dino.image_url || "",
      game: dino.game,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(false);
  }

  function requestRemove(dino) {
    if (shouldConfirmDangerousActions()) {
      setDinoToRemove(dino);
      return;
    }

    remove(dino);
  }

  async function remove(targetDino = dinoToRemove) {
    if (!targetDino) {
      return;
    }

    try {
      await dinoService.remove(targetDino.id);
      setDinoToRemove(null);
      success(t("dinosPage.removed"));
      await load();
    } catch (err) {
      setDinoToRemove(null);
      setActionError(err.message || t("dinosPage.removeError"));
    }
  }

  return (
    <Layout
      title={t("dinosPage.title")}
      actions={
        <div className={`dinos-page-actions ${editMode ? "editing" : ""}`.trim()}>
          <button
            className="btn ghost"
            type="button"
            onClick={() => setEditMode((next) => !next)}
            title={editMode ? t("dinosPage.normalViewTitle") : t("dinosPage.editTitle")}
            aria-label={editMode ? t("dinosPage.normalViewTitle") : t("dinosPage.editTitle")}
          >
            <Icon icon={editMode ? "mdi:eye-outline" : "mdi:pencil-outline"} width={18} aria-hidden="true" />
            {editMode ? t("dinosPage.normalView") : t("dinosPage.edit")}
          </button>
          {editMode ? (
            <button className="btn" onClick={openCreateModal} title={t("dinosPage.newDino")} aria-label={t("dinosPage.newDino")}>
              <Icon icon="mdi:plus" width={18} aria-hidden="true" />
              {t("dinosPage.newDino")}
            </button>
          ) : null}
        </div>
      }
    >
      <div className="dinos-admin-shell">
        <section className="card dinos-admin-hero">
          <div className="section-head dinos-admin-head">
            <div>
              <div className="h1">{t("dinosPage.heroTitle")}</div>
              <div className="muted">{t("dinosPage.heroText")}</div>
            </div>
            <DashboardWidgets items={dinoWidgets} />
          </div>
          {error ? <div className="error-box">{error}</div> : null}
        </section>

        {editMode ? (
          <AdminEditBanner text={t("dinosPage.editBanner")} />
        ) : null}

        <SearchFilterBar
          value={search}
          onChange={updateSearch}
          placeholder={t("dinosPage.searchPlaceholder")}
          filters={gameFilters}
          selectedFilter={gameFilter}
          onFilterChange={updateGameFilter}
        />

        {busy && dinos.length === 0 ? <Skeleton variant="dinos" count={6} /> : null}

        {!busy && !searchPending && dinos.length === 0 && !search.trim() ? (
          <EmptyState
            title={t("dinosPage.emptyTitle")}
            text={t("dinosPage.emptyText")}
            action={
              <button
                className="btn ghost"
                type="button"
                onClick={editMode ? openCreateModal : () => setEditMode(true)}
              >
                <Icon icon={editMode ? "mdi:plus" : "mdi:pencil-outline"} width={18} aria-hidden="true" />
                {editMode ? t("dinosPage.createDino") : t("dinosPage.activateEdit")}
              </button>
            }
          />
        ) : null}

        {!busy && !searchPending && (dinos.length > 0 || search.trim()) && filteredDinos.length === 0 ? (
          <EmptyState title={t("common.noResults")} text={t("dinosPage.noResultsText")} />
        ) : null}

        {(!busy || dinos.length > 0) && filteredDinos.length > 0 ? (
          <div className="dinos-admin-grid">
            {filteredDinos.map((dino) => {
              return (
                <article className="card dino-admin-card" key={dino.id}>
                  <DinoImage
                    src={dino?.image_url}
                    sources={[getDinoImageUrl(dino?.name)]}
                    className="dino-admin-image"
                    alt={dino.name}
                    fallback={(
                      <div className="dino-admin-image dino-admin-fallback">
                        <Icon icon="mdi:dinosaur" width={34} aria-hidden="true" />
                      </div>
                    )}
                  />
                  <div className="dino-admin-body">
                    <div className="h2">{dino.name}</div>
                    <div className="dino-admin-meta">
                      <GameBadge game={dino.game} />
                    </div>
                  </div>
                  <div className={`dino-admin-actions ${editMode ? "" : "hidden"}`.trim()} aria-hidden={!editMode}>
                    <button className="btn ghost" onClick={() => edit(dino)} aria-label={t("dinosPage.editItem", { name: dino.name })} title={t("dinosPage.editItem", { name: dino.name })} tabIndex={editMode ? 0 : -1}>
                      <Icon icon="mdi:pencil-outline" width={18} aria-hidden="true" />
                    </button>
                    <button className="btn danger" onClick={() => requestRemove(dino)} aria-label={t("dinosPage.deleteItem", { name: dino.name })} title={t("dinosPage.deleteItem", { name: dino.name })} tabIndex={editMode ? 0 : -1}>
                      <Icon icon="mdi:trash-can-outline" width={18} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
          <form
            className="challenge-modal dino-admin-modal"
            ref={dinoModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dino-modal-title"
            tabIndex={-1}
            onSubmit={save}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <div className="h1" id="dino-modal-title">{editingId ? t("dinosPage.formTitleEdit") : t("dinosPage.formTitleCreate")}</div>
                <div className="muted">{t("dinosPage.formDescription")}</div>
              </div>
              <button
                className="btn ghost icon-only"
                type="button"
                onClick={closeModal}
                title={t("dinosPage.closeForm")}
                aria-label={t("dinosPage.closeForm")}
              >
                <Icon icon="mdi:close" width={20} aria-hidden="true" />
              </button>
            </div>

            <label className="field-label">
              <span>{t("dinosPage.name")}</span>
              <input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Argentavis" required />
            </label>

            <label className="field-label">
              <span>{t("dinosPage.imageUrl")}</span>
              <input value={form.image_url} onChange={(e) => updateField("image_url", e.target.value)} placeholder="https://..." />
            </label>

            <div>
              <div className="modal-step-title">{t("dinosPage.game")}</div>
              <div className="game-choice-grid" role="radiogroup" aria-label={t("dinosPage.game")}>
                {gameOptions.map((game) => (
                  <button
                    className={`game-choice-card ${form.game === game.value ? "selected" : ""}`}
                    key={game.value}
                    type="button"
                    onClick={() => updateField("game", game.value)}
                    title={t("dinosPage.selectGame", { name: game.label })}
                    aria-label={t("dinosPage.selectGame", { name: game.label })}
                    role="radio"
                    aria-checked={form.game === game.value}
                  >
                    <AssetImage src={game.icon_url} alt="" ariaHidden="true" fallback={null} />
                    <span>{game.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn ghost" type="button" onClick={closeModal} title={t("common.cancel")} aria-label={t("dinosPage.cancelEdit")}>
                {t("common.cancel")}
              </button>
              <button className="btn" type="submit" title={editingId ? t("dinosPage.saveTitle") : t("dinosPage.createTitle")} aria-label={editingId ? t("dinosPage.saveTitle") : t("dinosPage.createTitle")}>
                <Icon icon={editingId ? "mdi:content-save-outline" : "mdi:plus"} width={18} aria-hidden="true" />
                {editingId ? t("common.save") : t("common.create")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(dinoToRemove)}
        variant="danger"
        title={t("dinosPage.deleteTitle")}
        message={dinoToRemove ? t("dinosPage.deleteMessage", { name: dinoToRemove.name }) : ""}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={remove}
        onCancel={() => setDinoToRemove(null)}
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
