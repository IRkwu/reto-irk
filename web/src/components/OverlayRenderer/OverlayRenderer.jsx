import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import {
  defaultOverlayConfig,
  getOverlayBaseScale,
  normalizeOverlayConfig,
  overlayWidgetOrder,
} from "../../utils/overlayConfig";
import { useI18n } from "../../i18n";
import { resolveAssetUrl } from "../../services/apiClient";
import "./OverlayRenderer.css";

const notificationEventTypes = [
  "dino_tamed",
  "dino_untamed",
  "life_decreased",
  "life_increased",
];
const NOTIFICATION_ENTER_MS = 260;
const NOTIFICATION_EXIT_MS = 280;
const eventIcons = {
  life_decreased: "mdi:heart-minus-outline",
  life_increased: "mdi:heart-plus-outline",
  dino_tamed: "mdi:check-circle-outline",
  dino_untamed: "mdi:close-circle-outline",
};
const previewNotificationEvent = {
  id_event: "preview-notification",
  event_type: "dino_tamed",
  player_name: "IRkwu",
  dino_name: "Carcharadontosaurio",
  lives_after: 7,
  message: "",
};

function getEventId(event) {
  return event.id_event || event.id || `${event.event_type}-${event.created_at}-${event.message}`;
}

function getWidgetStyle(widget, overlayScale) {
  const textAlign = widget.align === "horizontal" ? "left" : widget.align;
  const position = widget.position || { anchor: "top-left", offsetX: widget.x || 0, offsetY: widget.y || 0 };
  const style = {
    width: `${widget.width}px`,
    minWidth: widget.minWidth ? `${widget.minWidth}px` : undefined,
    opacity: widget.opacity,
    textAlign,
    "--overlay-widget-scale": overlayScale * widget.size,
  };

  if (position.anchor.includes("right")) {
    style.right = `${position.offsetX}px`;
  } else {
    style.left = `${position.offsetX}px`;
  }

  if (position.anchor.includes("bottom")) {
    style.bottom = `${position.offsetY}px`;
  } else {
    style.top = `${position.offsetY}px`;
  }

  style.transformOrigin = position.anchor.replace("-", " ");

  return style;
}

function getNotificationClass(widget) {
  return [
    `animation-${widget.animationDirection || "right-to-left"}`,
    `accent-${widget.accentPosition || "left"}`,
  ].join(" ");
}

function getPlayerInitial(name) {
  return (name || "J").trim().slice(0, 2).toUpperCase();
}

export default function OverlayRenderer({
  overlay,
  events = [],
  previewNotification = null,
  config = defaultOverlayConfig,
  challengeKey,
  preview = false,
  onWidgetPointerDown,
  onWidgetResizePointerDown,
}) {
  const { t } = useI18n();
  const nextConfig = useMemo(() => normalizeOverlayConfig(config), [config]);
  const overlayScale = useMemo(() => getOverlayBaseScale(nextConfig), [nextConfig]);
  const [notificationEntries, setNotificationEntries] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const knownNotificationIdsRef = useRef(new Set());
  const hasInitializedNotificationsRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 120);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    hasInitializedNotificationsRef.current = false;
    knownNotificationIdsRef.current = new Set();
    setNotificationEntries({});
  }, [challengeKey]);

  useEffect(() => {
    const currentTime = Date.now();
    const notificationEvents = events.filter((event) =>
      notificationEventTypes.includes(event.event_type)
    );

    if (!hasInitializedNotificationsRef.current) {
      notificationEvents.forEach((event) => {
        knownNotificationIdsRef.current.add(getEventId(event));
      });
      hasInitializedNotificationsRef.current = true;
      return;
    }

    setNotificationEntries((prev) => {
      const nextEntries = { ...prev };

      notificationEvents.forEach((event) => {
        const eventId = getEventId(event);

        if (knownNotificationIdsRef.current.has(eventId)) {
          if (nextEntries[eventId]) {
            nextEntries[eventId] = {
              ...nextEntries[eventId],
              event,
            };
          }
          return;
        }

        knownNotificationIdsRef.current.add(eventId);
        nextEntries[eventId] = {
          event,
          firstSeen: currentTime,
        };
      });

      return nextEntries;
    });
  }, [events]);

  useEffect(() => {
    const notificationDuration = nextConfig.widgets.notifications.durationMs;

    setNotificationEntries((prev) => {
      const nextEntries = {};

      Object.entries(prev).forEach(([eventId, entry]) => {
        if (now - entry.firstSeen > notificationDuration + NOTIFICATION_EXIT_MS) {
          return;
        }

        nextEntries[eventId] = entry;
      });

      return Object.keys(nextEntries).length === Object.keys(prev).length ? prev : nextEntries;
    });
  }, [nextConfig.widgets.notifications.durationMs, now]);

  useEffect(() => {
    if (!previewNotification) {
      return;
    }

    const eventId = getEventId(previewNotification);

    setNotificationEntries((prev) => ({
      ...prev,
      [eventId]: {
        event: previewNotification,
        firstSeen: Date.now(),
      },
    }));
  }, [previewNotification]);

  function getNotificationPhase(entry) {
    const age = now - entry.firstSeen;
    const notificationDuration = nextConfig.widgets.notifications.durationMs;

    if (age <= NOTIFICATION_ENTER_MS) {
      return "enter";
    }

    if (age >= notificationDuration) {
      return "exit";
    }

    return "visible";
  }

  const notificationWidget = nextConfig.widgets.notifications;
  const visibleNotifications = Object.entries(notificationEntries)
    .map(([eventId, entry]) => ({
      eventId,
      event: entry.event,
      firstSeen: entry.firstSeen,
      phase: getNotificationPhase(entry),
    }))
    .filter((entry) => now - entry.firstSeen <= notificationWidget.durationMs + NOTIFICATION_EXIT_MS)
    .sort((first, second) => second.firstSeen - first.firstSeen)
    .slice(0, notificationWidget.maxVisible);

  function renderWidget(widgetKey) {
    const widget = nextConfig.widgets[widgetKey];

    if (!widget?.visible) {
      return null;
    }

    const widgetProps = {
      className: `overlay-widget overlay-widget-${widgetKey} ${
        widgetKey === "notifications" ? getNotificationClass(widget) : ""
      }`.trim(),
      style: getWidgetStyle(widget, overlayScale),
      "data-widget": widgetKey,
      onPointerDown: preview
        ? (event) => onWidgetPointerDown?.(event, widgetKey)
        : undefined,
    };
    const resizeHandle = preview ? (
      <button
        className="overlay-widget-resize"
        type="button"
        aria-label={t("obsConfig.resize", { widget: t(`obsConfig.widgets.${widgetKey}`) })}
        title={t("obsConfig.resizeTitle")}
        onPointerDown={(event) => {
          event.stopPropagation();
          onWidgetResizePointerDown?.(event, widgetKey);
        }}
      />
    ) : null;

    if (widgetKey === "title") {
      return (
        <section key={widgetKey} {...widgetProps}>
          <div className="obs-title">{overlay?.challenge_name || t("obsConfig.fallbackChallenge")}</div>
          {widget.showMap ? <div className="obs-meta">{overlay?.map?.name || t("obsConfig.mapFallback")}</div> : null}
          {resizeHandle}
        </section>
      );
    }

    if (widgetKey === "lives") {
      return (
        <section key={widgetKey} {...widgetProps}>
          <div className="obs-lives-label">HP</div>
          <div className="obs-lives-value">
            <b>{overlay?.current_lives ?? 0}</b>
            <small>/ {overlay?.initial_lives ?? 0}</small>
          </div>
          {resizeHandle}
        </section>
      );
    }

    if (widgetKey === "dinos") {
      return (
        <section key={widgetKey} {...widgetProps}>
          <b>{overlay?.completed_dinos_count ?? 0}</b>
          <span>/ {overlay?.total_dinos_count ?? 0} dinos</span>
          {resizeHandle}
        </section>
      );
    }

    if (widgetKey === "notifications") {
      const notificationItems = preview && visibleNotifications.length === 0
        ? Array.from({ length: widget.maxVisible }, (_, index) => ({
            eventId: `${previewNotificationEvent.id_event}-${index}`,
            event: {
              ...previewNotificationEvent,
              lives_after: previewNotificationEvent.lives_after + index,
              message: index % 2 === 0 ? t("obsConfig.dinoTamed") : t("obsConfig.lifeAdded"),
              event_type: index % 2 === 0 ? "dino_tamed" : "life_increased",
            },
            phase: "visible",
          }))
        : visibleNotifications;

      return (
        <section key={widgetKey} {...widgetProps}>
          {notificationItems.map((entry) => (
            <EventToast
              key={entry.eventId}
              event={entry.event}
              phase={entry.phase}
              accentPosition={widget.accentPosition}
            />
          ))}
          {resizeHandle}
        </section>
      );
    }

    if (widgetKey === "players") {
      const players = overlay?.players || overlay?.challenge_players || [];
      const showNames = widget.displayMode !== "icon";
      const playerLayout = widget.align === "horizontal" || widget.layout === "horizontal" ? "horizontal" : "vertical";
      const playerAlignment = widget.align === "right" ? "align-right" : "align-left";

      return (
        <section key={widgetKey} {...widgetProps}>
          <div className={`obs-players-list ${playerLayout} ${playerAlignment} ${showNames ? "with-names" : "icons-only"}`.trim()}>
          {players.length ? (
            players.map((player) => (
              <div className="obs-player-row" key={player.id_player || player.id || player.player_id || player.name}>
                {resolveAssetUrl(player.player_icon_url || player.icon_url) ? (
                  <img
                    className="obs-player-icon"
                    src={resolveAssetUrl(player.player_icon_url || player.icon_url)}
                    alt=""
                    aria-hidden="true"
                  />
                ) : (
                  <span className="obs-player-icon fallback">{getPlayerInitial(player.player_name || player.name)}</span>
                )}
                {showNames ? <b>{player.player_name || player.name || t("obsConfig.fallbackPlayer")}</b> : null}
              </div>
            ))
          ) : (
            <div className="obs-player-row">
              <span className="obs-player-icon fallback">--</span>
              {showNames ? <b>{t("obsConfig.noPlayers")}</b> : null}
            </div>
          )}
          </div>
          {resizeHandle}
        </section>
      );
    }

    return null;
  }

  return (
    <div
      className={`obs-root overlay-renderer ${preview ? "preview" : ""}`.trim()}
      style={{
        width: `${nextConfig.resolution.width}px`,
        height: `${nextConfig.resolution.height}px`,
      }}
    >
      {overlayWidgetOrder.map(renderWidget)}
    </div>
  );
}

function EventToast({ event, phase = "visible", accentPosition = "left" }) {
  const { t } = useI18n();
  const dinoImageUrl = resolveAssetUrl(event.dino_image_url);
  const eventTitle = event.message || event.dino_name || event.event_type;
  const eventDetails = [
    event.player_name ? `${event.player_name}` : "",
    event.dino_name ? `${event.dino_name}` : "",
    event.lives_after != null ? t("obsConfig.livesDetail", { count: event.lives_after }) : "",
  ].filter(Boolean).join(" - ");

  return (
    <div className={`obs-toast ${event.event_type} ${phase} accent-${accentPosition}`.trim()}>
      {dinoImageUrl ? (
        <img
          className="toast-dino-image"
          src={dinoImageUrl}
          alt=""
          aria-hidden="true"
        />
      ) : eventIcons[event.event_type] ? (
        <span className="toast-event-icon">
          <Icon icon={eventIcons[event.event_type]} width={26} aria-hidden="true" />
        </span>
      ) : null}
      <div className="toast-text">
        <div className="toast-name">{eventTitle}</div>
        {eventDetails ? <div className="toast-player">{eventDetails}</div> : null}
      </div>
    </div>
  );
}
