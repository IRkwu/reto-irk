import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import { formatEventDate } from "../../utils/formatters";

const eventIcons = {
  life_decreased: "mdi:heart-minus-outline",
  life_increased: "mdi:heart-plus-outline",
  dino_tamed: "mdi:check-circle-outline",
  dino_untamed: "mdi:close-circle-outline",
  challenge_started: "mdi:play-circle-outline",
  challenge_completed: "mdi:trophy-outline",
  challenge_cancelled: "mdi:cancel",
};

function getEventTone(eventType) {
  if (["life_decreased", "dino_untamed", "challenge_cancelled"].includes(eventType)) {
    return "danger";
  }
  if (["life_increased", "dino_tamed", "challenge_completed"].includes(eventType)) {
    return "success";
  }
  return "info";
}

export default function ChallengeEventHistory({
  mode,
  recentEvents,
  visibleEvents,
  recentEventsLimit,
  playersById,
  dinosById,
  modalOpen,
  modalRef,
  onOpenModal,
  onCloseModal,
}) {
  if (mode === "summary") {
    return (
      <section className="card play-events-card">
        <div className="section-head recent-events-head">
          <div>
            <div className="h2">Eventos recientes</div>
            <p className="muted">Lo ultimo que paso en el reto</p>
          </div>
          {recentEvents.length > recentEventsLimit ? (
            <button
              className="btn ghost"
              type="button"
              onClick={onOpenModal}
              title="Ver todos los eventos"
              aria-label="Ver todos los eventos"
            >
              <Icon icon="mdi:history" width={18} aria-hidden="true" />
              Ver todos
            </button>
          ) : null}
        </div>
        <div className="recent-events-list">
          {visibleEvents.length ? (
            visibleEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                playersById={playersById}
                dinosById={dinosById}
              />
            ))
          ) : (
            <div className="empty-state compact">Sin eventos recientes.</div>
          )}
        </div>
      </section>
    );
  }

  if (mode !== "modal" || !modalOpen) {
    return null;
  }

  return (
    <div className="play-events-modal-backdrop" onClick={onCloseModal}>
      <div
        className="play-events-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="events-modal-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-head recent-events-head">
          <div>
            <div className="h2" id="events-modal-title">Historial de eventos</div>
            <p className="muted">{recentEvents.length} eventos registrados</p>
          </div>
          <button
            className="btn ghost icon-only"
            type="button"
            onClick={onCloseModal}
            title="Cerrar historial de eventos"
            aria-label="Cerrar historial de eventos"
          >
            <Icon icon="mdi:close" width={20} aria-hidden="true" />
          </button>
        </div>
        <div className="recent-events-list play-events-modal-list">
          {recentEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              playersById={playersById}
              dinosById={dinosById}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, playersById, dinosById }) {
  const playerName = playersById.get(event.player_id)?.player?.name;
  const dinoName = dinosById.get(event.dino_id)?.name;
  const tone = getEventTone(event.event_type);

  return (
    <div className={`recent-event-row ${tone}`}>
      <span className="recent-event-icon">
        <Icon icon={eventIcons[event.event_type] || "mdi:history"} width={20} aria-hidden="true" />
      </span>
      <span className="recent-event-copy">
        <b>{event.message || event.event_type}</b>
        <span>
          {[playerName, dinoName, formatEventDate(event.created_at)].filter(Boolean).join(" - ")}
        </span>
      </span>
      {event.lives_after != null ? (
        <span className="recent-event-lives">{event.lives_after} vidas</span>
      ) : null}
    </div>
  );
}
