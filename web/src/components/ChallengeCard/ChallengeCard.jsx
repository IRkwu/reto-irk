import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../AppIcon/AppIcon.jsx";
import GameBadge from "../GameBadge/GameBadge.jsx";
import { useI18n } from "../../i18n";
import StatusBadge from "../StatusBadge/StatusBadge.jsx";
import {
  buildOverlayUrl,
  hasSeenObsConfigGuide,
  markObsConfigGuideSeen,
} from "../../utils/overlayConfig";
import "./ChallengeCard.css";

export default function ChallengeCard({ challenge, mapName }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [obsCopied, setObsCopied] = useState(false);
  const copyTimerRef = useRef(null);
  const completedDinos = challenge.completed_dinos_count ?? 0;
  const totalDinos = challenge.total_dinos_count ?? 0;
  const canEdit = challenge.status === "draft" || challenge.status === "active";
  const canOpenPlay = challenge.status !== "draft";
  const canOpenObs = challenge.status === "active";

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  async function copyObsOverlayUrl() {
    if (!hasSeenObsConfigGuide()) {
      markObsConfigGuideSeen();
      navigate("/obs/config?firstObsConfig=1");
      return;
    }

    const obsUrl = buildOverlayUrl(challenge.id);

    try {
      await navigator.clipboard.writeText(new URL(obsUrl, window.location.origin).toString());
      setObsCopied(true);
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setObsCopied(false), 2200);
    } catch {
      setObsCopied(false);
    }
  }

  return (
    <article className="card challenge-card">
      <div className="card-head">
        <div>
          <div className="challenge-card-title-row">
            <div className="h2">{challenge.name}</div>
          </div>
        </div>
        <div className="challenge-card-status-row">
          <GameBadge game={challenge.game} />
          <StatusBadge status={challenge.status} />
        </div>
        <div className="challenge-card-meta">
          <span>
            <Icon icon="mdi:map-marker-radius-outline" width={16} aria-hidden="true" />
            {mapName || t("common.noMap")}
          </span>
          <span>
            <Icon icon="mdi:account-group-outline" width={16} aria-hidden="true" />
            {t("challenges.card.playersCount", { count: challenge.player_count })}
          </span>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-mini">
          <span>{t("challenges.card.lives")}</span>
          <b>
            {challenge.current_lives}/{totalDinos}
          </b>
        </div>
        <div className="metric-mini">
          <span>{t("challenges.card.tamedDinos")}</span>
          <b>{completedDinos}/{totalDinos}</b>
        </div>
      </div>

      <div className="card-actions">
        {canOpenPlay ? (
          <Link
            className="btn ghost"
            to={`/challenges/${challenge.id}`}
            title={t("challenges.card.openTitle", { name: challenge.name })}
            aria-label={t("challenges.card.openTitle", { name: challenge.name })}
          >
            <Icon icon="mdi:play-circle-outline" width={18} aria-hidden="true" />
            {t("challenges.card.open")}
          </Link>
        ) : null}
        {canEdit ? (
          <Link
            className="btn ghost"
            to={`/challenges/${challenge.id}/edit`}
            title={t("challenges.card.editTitle", { name: challenge.name })}
            aria-label={t("challenges.card.editTitle", { name: challenge.name })}
          >
            <Icon icon="mdi:pencil-outline" width={18} aria-hidden="true" />
            {t("challenges.card.edit")}
          </Link>
        ) : null}
        {canOpenObs ? (
          <button
            type="button"
            className="btn ghost"
            onClick={copyObsOverlayUrl}
            title={t("challenges.card.obsTitle", { name: challenge.name })}
            aria-label={t("challenges.card.obsTitle", { name: challenge.name })}
          >
            <Icon icon={obsCopied ? "mdi:check" : "mdi:monitor-eye"} width={18} aria-hidden="true" />
            {obsCopied ? t("challenges.card.copied") : t("challenges.card.obs")}
          </button>
        ) : null}
      </div>
      {obsCopied ? (
        <div className="obs-copy-feedback" role="status" aria-live="polite">
          <Icon icon="mdi:content-copy" width={16} aria-hidden="true" />
          {t("challenges.card.obsCopied")}
        </div>
      ) : null}
    </article>
  );
}
