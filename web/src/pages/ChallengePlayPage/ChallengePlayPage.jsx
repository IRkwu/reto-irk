import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import { useParams } from "react-router-dom";
import DinoCardGrid from "../../components/DinoCardGrid/DinoCardGrid.jsx";
import Layout from "../../components/Layout/Layout.jsx";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import StatusBadge from "../../components/StatusBadge/StatusBadge.jsx";
import { useChallengeSocket } from "../../hooks/useChallengeSocket";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { useStaleRequestGuard } from "../../hooks/useStaleRequestGuard";
import { assignmentService } from "../../services/assignmentService";
import {
  challengePlayerService,
  challengeService,
} from "../../services/challengeService";
import { dinoService } from "../../services/dinoService";
import { gameplayService } from "../../services/gameplayService";
import { mapService, spawnZoneService } from "../../services/mapService";
import { indexById } from "../../utils/formatters";
import ChallengeEventHistory from "./ChallengeEventHistory.jsx";
import "./ChallengePlayPage.css";

const RECENT_EVENTS_LIMIT = 6;
const EVENT_HISTORY_LIMIT = 100;

export default function ChallengePlayPage() {
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [mapName, setMapName] = useState("");
  const [spawnZoneName, setSpawnZoneName] = useState("");
  const [players, setPlayers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [dinos, setDinos] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsModalOpen, setEventsModalOpen] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [busyAssignmentId, setBusyAssignmentId] = useState(null);
  const { nextRequestId, isCurrentRequest } = useStaleRequestGuard();

  const dinosById = useMemo(() => indexById(dinos), [dinos]);
  const assignmentsByPlayer = useMemo(() => {
    const grouped = new Map(players.map((player) => [player.id, []]));
    grouped.set("none", []);

    assignments.forEach((assignment) => {
      const key = assignment.player_id || "none";
      grouped.set(key, [...(grouped.get(key) || []), assignment]);
    });

    return grouped;
  }, [assignments, players]);

  const progress = useMemo(() => {
    const completed = assignments.filter((assignment) => assignment.is_tamed).length;
    return { completed, total: assignments.length };
  }, [assignments]);

  const playersById = useMemo(() => indexById(players), [players]);
  const canEditGameplay = challenge?.status === "active";
  const recentEvents = useMemo(
    () => [...events].sort((a, b) => (b.id || 0) - (a.id || 0)),
    [events]
  );
  const visibleEvents = useMemo(
    () => recentEvents.slice(0, RECENT_EVENTS_LIMIT),
    [recentEvents]
  );
  const closeEventsModal = useCallback(() => setEventsModalOpen(false), []);
  const eventsModalRef = useModalAccessibility(eventsModalOpen, closeEventsModal);

  const load = useCallback(async () => {
    const requestId = nextRequestId();

    setBusy(true);
    setError("");

    try {
      const [challengeData, playerData, assignmentData, dinoData, eventData] =
        await Promise.all([
          challengeService.get(challengeId),
          challengePlayerService.list(challengeId),
          assignmentService.list(challengeId),
          dinoService.list({ limit: 200 }),
          gameplayService.listEvents(challengeId, { limit: EVENT_HISTORY_LIMIT }),
        ]);

      const [mapData, zones] = await Promise.all([
        mapService.get(challengeData.map_id),
        spawnZoneService.list(challengeData.map_id, { limit: 200 }),
      ]);

      if (isCurrentRequest(requestId)) {
        setChallenge(challengeData);
        setPlayers(playerData.sort((a, b) => a.position - b.position));
        setAssignments(assignmentData);
        setDinos(dinoData);
        setEvents(eventData);
        setMapName(mapData.name);
        setSpawnZoneName(
          zones.find((zone) => zone.id === challengeData.spawn_zone_id)?.name || ""
        );
      }
    } catch (err) {
      if (isCurrentRequest(requestId)) {
        setError(err.message || "No se pudo cargar el reto");
      }
    } finally {
      if (isCurrentRequest(requestId)) {
        setBusy(false);
      }
    }
  }, [challengeId, isCurrentRequest, nextRequestId]);

  useEffect(() => {
    load();
  }, [load]);

  useChallengeSocket(challengeId, () => {
    load();
  });

  async function changeLives(direction) {
    try {
      const updated =
        direction === "increase"
          ? await gameplayService.increaseLives(challengeId)
          : await gameplayService.decreaseLives(challengeId);
      setChallenge(updated);
      setEvents(await gameplayService.listEvents(challengeId, { limit: EVENT_HISTORY_LIMIT }));
    } catch (err) {
      setError(err.message || "No se pudieron actualizar vidas");
    }
  }

  async function toggleAssignment(assignment) {
    setBusyAssignmentId(assignment.id);

    try {
      if (assignment.is_tamed) {
        await assignmentService.untame(challengeId, assignment.id);
      } else {
        await assignmentService.tame(challengeId, assignment.id, assignment.player_id);
      }
      await load();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el dino");
    } finally {
      setBusyAssignmentId(null);
    }
  }

  if (busy && !challenge) {
    return (
      <Layout title="Reto">
        <Skeleton variant="play" />
      </Layout>
    );
  }

  return (
    <Layout
      title={challenge ? `${challenge.name} (${mapName})` : "Reto"}
    >
      <div className="play-shell">
      {error ? <div className="error-box">{error}</div> : null}

      {challenge ? (
        <section className="lives play-lives-card">
          <div className="play-lives-main">
            <div className="play-section-label">Reto activo</div>
            <div className="h1">Vidas</div>
            <div className="lives-number">
              <span className="big">{challenge.current_lives}</span>
              <span className="muted"> / {progress.total}</span>
            </div>
            <div className="play-meta-row">
              {spawnZoneName ? (
                <span>
                  <Icon icon="mdi:map-marker-radius-outline" width={16} aria-hidden="true" />
                  {spawnZoneName}
                </span>
              ) : null}
            </div>
          </div>
          <div className="lives-controls">
            <span className="play-tamed-chip">
              <Icon icon="mdi:check-circle-outline" width={16} aria-hidden="true" />
              {progress.completed} / {progress.total} tameados
            </span>
            <StatusBadge status={challenge.status} />
            {canEditGameplay ? (
              <>
                <button
                  className="btn ghost play-life-btn"
                  onClick={() => changeLives("decrease")}
                  title="Restar una vida"
                  aria-label="Restar una vida"
                >
                  <Icon icon="mdi:heart-minus-outline" width={18} aria-hidden="true" />
                  -1
                </button>
                <button
                  className="btn ghost play-life-btn"
                  onClick={() => changeLives("increase")}
                  title="Sumar una vida"
                  aria-label="Sumar una vida"
                >
                  <Icon icon="mdi:heart-plus-outline" width={18} aria-hidden="true" />
                  +1
                </button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="players-grid play-players-grid" style={{ "--cols": Math.max(1, players.length) }}>
        {players.map((player) => {
          const playerAssignments = assignmentsByPlayer.get(player.id) || [];
          const completedCount = playerAssignments.filter((item) => item.is_tamed).length;

          return (
            <section className="card playercol play-player-card" key={player.id}>
              <div className="player-head">
                <div className="player-admin-title play-player-title">
                  <PlayerAvatar player={player.player} className="player-admin-avatar play-player-avatar" />
                  <div>
                    <div className="h2">{player.player?.name}</div>
                    <div className="player-spawn-chip">
                      <Icon icon="mdi:map-marker-radius-outline" width={15} aria-hidden="true" />
                      {player.spawn_zone?.name || "Cualquier spawn"}
                    </div>
                  </div>
                </div>
                <div className="play-progress-chip">
                  <b>{completedCount}</b> / {playerAssignments.length}
                </div>
              </div>
              <DinoCardGrid
                assignments={playerAssignments}
                getDino={(assignment) => dinosById.get(assignment.dino_id)}
                busyAssignmentId={busyAssignmentId}
                onAssignmentClick={toggleAssignment}
                disabled={() => !canEditGameplay}
                className="challenge-dino-card-grid"
              />
            </section>
          );
        })}
      </div>

      {(assignmentsByPlayer.get("none") || []).length ? (
        <section className="card play-player-card">
          <div className="section-head recent-events-head">
            <div>
              <div className="h2">Sin jugador asignado</div>
              <p className="muted">Dinos pendientes de repartir</p>
            </div>
          </div>
          <DinoCardGrid
            assignments={assignmentsByPlayer.get("none")}
            getDino={(assignment) => dinosById.get(assignment.dino_id)}
            busyAssignmentId={busyAssignmentId}
            onAssignmentClick={toggleAssignment}
            disabled={() => !canEditGameplay}
            className="challenge-dino-card-grid"
          />
        </section>
      ) : null}

      <ChallengeEventHistory
        mode="summary"
        recentEvents={recentEvents}
        visibleEvents={visibleEvents}
        recentEventsLimit={RECENT_EVENTS_LIMIT}
        playersById={playersById}
        dinosById={dinosById}
        onOpenModal={() => setEventsModalOpen(true)}
      />
      </div>

      <ChallengeEventHistory
        mode="modal"
        recentEvents={recentEvents}
        playersById={playersById}
        dinosById={dinosById}
        modalOpen={eventsModalOpen}
        modalRef={eventsModalRef}
        onCloseModal={closeEventsModal}
      />
    </Layout>
  );
}

