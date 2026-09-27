import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import DinoImage from "../../components/DinoImage/DinoImage.jsx";
import { formatEventDate, parseEventDate } from "../../utils/formatters";
import { getDinoImageUrl } from "../../utils/dinoIcons";

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
        {visibleEvents.length ? (
          <EventTimeline
            events={visibleEvents}
            playersById={playersById}
            dinosById={dinosById}
          />
        ) : (
          <div className="recent-events-list">
            <div className="empty-state compact">Sin eventos recientes.</div>
          </div>
        )}
      </section>
    );
  }

  if (mode !== "modal" || !modalOpen) {
    return null;
  }

  return (
    <div className="play-events-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCloseModal()}>
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
        <div className="play-events-modal-list">
          <EventTimeline
            events={recentEvents}
            playersById={playersById}
            dinosById={dinosById}
          />
        </div>
      </div>
    </div>
  );
}

function EventTimeline({ events, playersById, dinosById }) {
  return (
    <div className="recent-events-list event-timeline">
      {groupEventsByDay(events).map((group) => (
        <section className="event-day-group" key={group.key}>
          <div className="event-day-label">
            <span>{group.label}</span>
            <span>{group.events.length} eventos</span>
          </div>
          <div className="event-day-items">
            {group.events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                playersById={playersById}
                dinosById={dinosById}
                showDate={false}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupEventsByDay(events) {
  const groups = new Map();

  events.forEach((event) => {
    const date = parseEventDate(event.created_at);
    const key = Number.isNaN(date.getTime())
      ? "unknown"
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const group = groups.get(key) || {
      key,
      label: formatEventDay(date),
      events: [],
    };
    group.events.push(event);
    groups.set(key, group);
  });

  return [...groups.values()];
}

function formatEventDay(date) {
  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round((startOfToday - startOfDate) / 86400000);

  if (dayDifference === 0) {
    return "Hoy";
  }
  if (dayDifference === 1) {
    return "Ayer";
  }

  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function EventRow({ event, playersById, dinosById, showDate = true }) {
  const playerName = playersById.get(event.player_id)?.player?.name;
  const dino = dinosById.get(event.dino_id);
  const dinoName = dino?.name;
  const tone = getEventTone(event.event_type);
  const eventDate = formatEventDate(event.created_at);
  const eventTime = eventDate.includes(",")
    ? eventDate.slice(eventDate.lastIndexOf(",") + 1).trim()
    : "";

  return (
    <div className={`recent-event-row ${tone}`}>
      <span className="recent-event-icon">
        {["dino_tamed", "dino_untamed"].includes(event.event_type) ? (
          <DinoImage
            src={dino?.image_url}
            sources={[getDinoImageUrl(dino?.name)]}
            className="recent-event-dino-image"
            ariaHidden="true"
            fallback={<Icon icon={eventIcons[event.event_type] || "mdi:history"} width={20} aria-hidden="true" />}
          />
        ) : (
          <Icon icon={eventIcons[event.event_type] || "mdi:history"} width={20} aria-hidden="true" />
        )}
      </span>
      <span className="recent-event-copy">
        <b>{event.message || event.event_type}</b>
        <span>
          {[playerName, dinoName, showDate ? eventDate : eventTime].filter(Boolean).join(" - ")}
        </span>
      </span>
      {event.lives_after != null ? (
        <span className="recent-event-lives">{event.lives_after} vidas</span>
      ) : null}
    </div>
  );
}
