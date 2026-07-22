import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog.jsx";
import Layout from "../../components/Layout/Layout.jsx";
import RouletteModal from "../../components/RouletteModal/RouletteModal.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import StatusBadge from "../../components/StatusBadge/StatusBadge.jsx";
import ZoneRouletteModal from "../../components/ZoneRouletteModal/ZoneRouletteModal.jsx";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import { assignmentService } from "../../services/assignmentService";
import { challengePlayerService, challengeService } from "../../services/challengeService";
import { dinoService } from "../../services/dinoService";
import { mapService, spawnZoneService } from "../../services/mapService";
import { rouletteService } from "../../services/rouletteService";
import { indexById } from "../../utils/formatters";
import { shouldConfirmDangerousActions } from "../../utils/settings";
import ChallengePlayerEditorCard from "./ChallengePlayerEditorCard.jsx";
import "./ChallengeEditorPage.css";

export default function ChallengeEditorPage() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [maps, setMaps] = useState([]);
  const [spawnZones, setSpawnZones] = useState([]);
  const [challengePlayers, setChallengePlayers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [dinos, setDinos] = useState([]);
  const [selectedDinoByPlayer, setSelectedDinoByPlayer] = useState({});
  const [roulettePool, setRoulettePool] = useState([]);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [roulettePlayerId, setRoulettePlayerId] = useState(null);
  const [rouletteKind, setRouletteKind] = useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const dinosById = useMemo(() => indexById(dinos), [dinos]);
  const assignedDinoIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.dino_id)),
    [assignments]
  );
  const assignedSpawnZoneIds = useMemo(
    () =>
      new Set(
        challengePlayers
          .map((player) => player.spawn_zone_id)
          .filter(Boolean)
      ),
    [challengePlayers]
  );
  const assignmentsByPlayer = useMemo(() => {
    const grouped = new Map(challengePlayers.map((player) => [player.id, []]));

    assignments.forEach((assignment) => {
      if (!assignment.player_id) {
        return;
      }

      grouped.set(assignment.player_id, [
        ...(grouped.get(assignment.player_id) || []),
        assignment,
      ]);
    });

    return grouped;
  }, [assignments, challengePlayers]);
  const mapName = useMemo(
    () => maps.find((map) => map.id === challenge?.map_id)?.name || "Mapa",
    [challenge?.map_id, maps]
  );
  const canEditChallenge = challenge?.status === "draft" || challenge?.status === "active";
  const canStartChallenge = challenge?.status === "draft";
  const canCancelChallenge = challenge?.status === "draft" || challenge?.status === "active";
  const shouldExpandReadOnlyName = challenge?.status === "completed";

  const load = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const [challengeData, mapData, challengePlayerData, assignmentData] =
        await Promise.all([
          challengeService.get(challengeId),
          mapService.list({ limit: 200 }),
          challengePlayerService.list(challengeId),
          assignmentService.list(challengeId),
        ]);
      const dinoData = await dinoService.list({
        id_map: challengeData.map_id,
        limit: 200,
      });

      setChallenge(challengeData);
      setMaps(mapData);
      setChallengePlayers(challengePlayerData.sort((a, b) => a.position - b.position));
      setAssignments(assignmentData);
      setDinos(dinoData);
      setSpawnZones(await spawnZoneService.list(challengeData.map_id, { limit: 200 }));
    } catch (err) {
      setError(err.message || "No se pudo cargar el editor");
    } finally {
      setBusy(false);
    }
  }, [challengeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveBasics(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const updated = await challengeService.update(challengeId, {
        name: form.get("name"),
      });
      setChallenge(updated);
    } catch (err) {
      setError(err.message || "No se pudo guardar el reto");
    }
  }

  async function updatePlayerSpawnZone(challengePlayerId, spawnZoneId) {
    try {
      await challengePlayerService.update(challengeId, challengePlayerId, {
        spawn_zone_id: spawnZoneId ? Number(spawnZoneId) : null,
      });
      await load();
    } catch (err) {
      setError(err.message || "No se pudo guardar zona de spawn");
    }
  }

  async function addAssignmentForPlayer(playerId) {
    const dinoId = Number(selectedDinoByPlayer[playerId]);

    if (!dinoId) {
      return;
    }

    try {
      await assignmentService.create(challengeId, {
        player_id: playerId,
        dino_id: dinoId,
      });
      setSelectedDinoByPlayer((prev) => ({ ...prev, [playerId]: "" }));
      await load();
    } catch (err) {
      setError(err.message || "No se pudo asignar dino");
    }
  }

  async function removeAssignment(assignmentId) {
    try {
      await assignmentService.remove(challengeId, assignmentId);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo quitar asignacion");
    }
  }

  async function openDinoRoulette(playerId) {
    try {
      const pool = await rouletteService.listDinos(challengeId);
      setRoulettePool(pool);
      setRoulettePlayerId(playerId);
      setRouletteKind("dino");
      setRouletteResult(null);
    } catch (err) {
      setError(err.message || "No se pudo abrir la ruleta");
    }
  }

  function openSpawnZoneRoulette(playerId) {
    const usedZoneIds = new Set(
      challengePlayers
        .filter((player) => player.id !== playerId)
        .map((player) => player.spawn_zone_id)
        .filter(Boolean)
    );
    const availableSpawnZones = spawnZones.filter((zone) => !usedZoneIds.has(zone.id));

    if (availableSpawnZones.length === 0) {
      setError("No quedan zonas de spawn disponibles para este reto.");
      return;
    }

    setRoulettePool(availableSpawnZones);
    setRoulettePlayerId(playerId);
    setRouletteKind("spawn_zone");
    setRouletteResult(null);
  }

  async function rollRoulette() {
    if (rouletteKind === "spawn_zone") {
      const item = roulettePool[Math.floor(Math.random() * roulettePool.length)];
      setRouletteResult(item);
      return { item };
    }

    const response = await rouletteService.roll(challengeId);
    setRouletteResult(response.dino);
    return response;
  }

  async function assignRouletteResult() {
    if (!rouletteResult) {
      return;
    }

    try {
      if (rouletteKind === "spawn_zone") {
        await challengePlayerService.update(challengeId, roulettePlayerId, {
          spawn_zone_id: rouletteResult.id,
        });
      } else {
        await rouletteService.assign(challengeId, {
          dino_id: rouletteResult.id,
          player_id: roulettePlayerId,
        });
      }
      setRouletteResult(null);
      setRoulettePool([]);
      setRoulettePlayerId(null);
      setRouletteKind(null);
      await load();
    } catch (err) {
      setError(err.message || "No se pudo asignar resultado");
    }
  }

  async function startChallenge() {
    try {
      await challengeService.start(challengeId);
      navigate(`/challenges/${challengeId}`);
    } catch (err) {
      setError(err.message || "No se pudo iniciar el reto");
    }
  }

  async function cancelChallenge() {
    setCanceling(true);

    try {
      await challengeService.cancel(challengeId);
      navigate(`/challenges/${challengeId}`);
    } catch (err) {
      setError(err.message || "No se pudo cancelar el reto");
      setCancelDialogOpen(false);
    } finally {
      setCanceling(false);
    }
  }

  function requestCancelChallenge() {
    if (shouldConfirmDangerousActions()) {
      setCancelDialogOpen(true);
      return;
    }

    cancelChallenge();
  }

  if (busy && !challenge) {
    return (
      <Layout title="Editor">
        <Skeleton variant="editor" />
      </Layout>
    );
  }

  return (
    <Layout
      title={challenge ? `Editor: ${challenge.name}` : "Editor"}
    >
      <div className="editor-shell">
      {error ? <div className="error-box">{error}</div> : null}

      {challenge ? (
        <section className="card editor-config-card">
          <div className="section-head">
            <div>
              <div className="h1">Configuracion del reto</div>
              <div className="muted">
                {mapName} - {challenge.player_count} jugadores
              </div>
            </div>
            <div className="row">
              <StatusBadge status={challenge.status} />
              {canStartChallenge ? (
                <button
                  className="btn editor-start-button"
                  type="button"
                  onClick={startChallenge}
                  title="Iniciar reto"
                  aria-label="Iniciar reto"
                >
                  Iniciar reto
                </button>
              ) : null}
              {canCancelChallenge ? (
                <button
                  className="btn danger editor-cancel-button"
                  type="button"
                  aria-label="Cancelar reto"
                  title="Cancelar reto"
                  onClick={requestCancelChallenge}
                >
                  <Icon icon="mdi:trash-can-outline" width={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <form
            className={`editor-summary-form ${shouldExpandReadOnlyName ? "read-only" : ""}`.trim()}
            onSubmit={saveBasics}
          >
            <input name="name" defaultValue={challenge.name} required disabled={!canEditChallenge} />
            {canEditChallenge ? <button className="btn" type="submit" title="Renombrar" aria-label="Renombrar reto">Renombrar</button> : null}
          </form>
        </section>
      ) : null}

      <section className="editor-player-list">
        {challengePlayers.map((challengePlayer) => (
          <ChallengePlayerEditorCard
            key={challengePlayer.id}
            challengePlayer={challengePlayer}
            assignments={assignmentsByPlayer.get(challengePlayer.id) || []}
            dinos={dinos}
            dinosById={dinosById}
            assignedDinoIds={assignedDinoIds}
            spawnZones={spawnZones}
            assignedSpawnZoneIds={assignedSpawnZoneIds}
            selectedDinoId={selectedDinoByPlayer[challengePlayer.id] || ""}
            canEditChallenge={canEditChallenge}
            onUpdateSpawnZone={updatePlayerSpawnZone}
            onSelectedDinoChange={(playerId, nextValue) =>
              setSelectedDinoByPlayer((prev) => ({
                ...prev,
                [playerId]: nextValue,
              }))
            }
            onAddAssignment={addAssignmentForPlayer}
            onRemoveAssignment={removeAssignment}
            onOpenDinoRoulette={openDinoRoulette}
            onOpenSpawnZoneRoulette={openSpawnZoneRoulette}
          />
        ))}
      </section>

      {rouletteKind === "spawn_zone" ? (
        <ZoneRouletteModal
          open={roulettePool.length > 0}
          pool={roulettePool}
          result={rouletteResult}
          onRoll={rollRoulette}
          onAssign={assignRouletteResult}
          onClose={() => {
            setRoulettePool([]);
            setRouletteResult(null);
            setRoulettePlayerId(null);
            setRouletteKind(null);
          }}
        />
      ) : (
        <RouletteModal
          open={roulettePool.length > 0}
          pool={roulettePool}
          result={rouletteResult}
          title="Ruleta de dinos"
          assignLabel="Asignar dino"
          onRoll={rollRoulette}
          onAssign={assignRouletteResult}
          onClose={() => {
            setRoulettePool([]);
            setRouletteResult(null);
            setRoulettePlayerId(null);
            setRouletteKind(null);
          }}
        />
      )}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Cancelar reto"
        message="El reto quedara cancelado y ya no se podra editar ni iniciar."
        confirmLabel="Cancelar reto"
        variant="danger"
        loading={canceling}
        onConfirm={cancelChallenge}
        onCancel={() => setCancelDialogOpen(false)}
      />
      </div>
    </Layout>
  );
}
