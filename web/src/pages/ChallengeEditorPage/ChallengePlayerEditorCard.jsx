import AppSelect from "../../components/AppSelect/AppSelect.jsx";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import DinoIcon from "../../components/DinoIcon/DinoIcon.jsx";
import DinoCardGrid from "../../components/DinoCardGrid/DinoCardGrid.jsx";
import Picker from "../../components/Picker/Picker.jsx";
import PlayerAvatar from "../../components/PlayerAvatar/PlayerAvatar.jsx";
import { DINO_PICKER_FALLBACK_URL } from "../../utils/dinoIcons";

const DEFAULT_DINO_PICKER_ICON_URL = DINO_PICKER_FALLBACK_URL;
const PLAYER_CARD_STYLE = { alignContent: "start" };

export default function ChallengePlayerEditorCard({
  challengePlayer,
  assignments,
  dinos,
  dinosById,
  assignedDinoIds,
  spawnZones,
  assignedSpawnZoneIds,
  selectedDinoId,
  canEditChallenge,
  onUpdateSpawnZone,
  onSelectedDinoChange,
  onAddAssignment,
  onRemoveAssignment,
  onOpenDinoRoulette,
  onOpenSpawnZoneRoulette,
}) {
  const availableDinos = dinos.filter((dino) => !assignedDinoIds.has(dino.id));
  const spawnZoneOptions = [
    { value: "", label: "Sin zona" },
    ...spawnZones
      .filter(
        (zone) =>
          zone.id === challengePlayer.spawn_zone_id ||
          !assignedSpawnZoneIds.has(zone.id)
      )
      .map((zone) => ({
        value: zone.id,
        label: zone.name,
      })),
  ];
  const dinoOptions = [
    { value: "", label: "Seleccionar dino", icon: "mdi:egg-outline" },
    ...availableDinos.map((dino) => ({
      value: dino.id,
      label: dino.name,
      image_url: dino.image_url,
      icon: "mdi:dinosaur",
    })),
  ];

  return (
    <article
      className="card editor-player-card"
      style={PLAYER_CARD_STYLE}
    >
      <div className="editor-player-head">
        <div className="player-admin-title">
          <PlayerAvatar player={challengePlayer.player} className="player-admin-avatar" />
          <div>
            <div className="h2">{challengePlayer.player?.name}</div>
            <div className="player-spawn-chip">
              <Icon icon="mdi:map-marker-radius-outline" width={15} aria-hidden="true" />
              {challengePlayer.spawn_zone?.name || "Cualquier spawn"}
            </div>
          </div>
        </div>
        <button
          className="btn ghost"
          type="button"
          disabled={!canEditChallenge}
          onClick={() =>
            challengePlayer.spawn_zone_id
              ? onOpenDinoRoulette(challengePlayer.id)
              : onOpenSpawnZoneRoulette(challengePlayer.id)
          }
          title={challengePlayer.spawn_zone_id ? "Ruleta dino" : "Ruleta zona"}
          aria-label={challengePlayer.spawn_zone_id ? "Abrir ruleta de dinos" : "Abrir ruleta de zonas de spawn"}
        >
          {challengePlayer.spawn_zone_id ? "Ruleta dino" : "Ruleta zona"}
        </button>
      </div>

      <div className="editor-player-controls">
        <label>
          <span>Zona de spawn</span>
          <AppSelect
            value={challengePlayer.spawn_zone_id || ""}
            options={spawnZoneOptions}
            disabled={!canEditChallenge}
            onChange={(nextValue) => onUpdateSpawnZone(challengePlayer.id, nextValue)}
          />
        </label>

        <label>
          <span>Dino para asignar</span>
          <Picker
            value={selectedDinoId || ""}
            options={dinoOptions}
            variant="dino-grid"
            getIcon={(option) => (
              <DinoIcon dino={option?.value ? option : undefined} imageClassName="picker-thumb" iconClassName="picker-dino-fallback" fallbackImageUrl={DEFAULT_DINO_PICKER_ICON_URL} />
            )}
            disabled={!canEditChallenge}
            onChange={(nextValue) => onSelectedDinoChange(challengePlayer.id, nextValue)}
          />
        </label>

        <button
          className="btn"
          type="button"
          disabled={!canEditChallenge || !selectedDinoId}
          onClick={() => onAddAssignment(challengePlayer.id)}
          title="Asignar dino"
          aria-label="Asignar dino"
        >
          Asignar dino
        </button>
      </div>

      <DinoCardGrid
        assignments={assignments}
        getDino={(assignment) => dinosById.get(assignment.dino_id)}
        className="challenge-dino-card-grid"
        onAssignmentClick={
          canEditChallenge ? (assignment) => onRemoveAssignment(assignment.id) : undefined
        }
        actionLabel={(assignment) =>
          canEditChallenge && !assignment.is_tamed ? "Quitar dino" : undefined
        }
        disabled={(assignment) => !canEditChallenge || assignment.is_tamed}
      />

      {assignments.length === 0 ? (
        <div className="muted">Sin dinos asignados.</div>
      ) : null}
    </article>
  );
}
