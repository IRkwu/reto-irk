import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppSelect from "../../components/AppSelect/AppSelect.jsx";
import { useNotifications } from "../../components/Notifications";
import OverlayRenderer from "../../components/OverlayRenderer/OverlayRenderer.jsx";
import { useChallengeSocket } from "../../hooks/useChallengeSocket";
import { useStaleRequestGuard } from "../../hooks/useStaleRequestGuard";
import { useI18n } from "../../i18n";
import { overlayService } from "../../services/overlayService";
import {
  defaultOverlayConfig,
  getOverlayBaseScale,
  getOverlayWidgetWidthLimits,
  getPlayerWidgetWidth,
  OVERLAY_MAX_WIDGET_SCALE,
  OVERLAY_MIN_WIDGET_SCALE,
  normalizeOverlayConfig,
  overlayResolutionPresets,
  overlayWidgetOrder,
  readGlobalOverlayConfig,
  saveGlobalOverlayConfig,
} from "../../utils/overlayConfig";
import "./OverlayConfigPage.css";

const alignmentOptionDefs = [
  { value: "left", labelKey: "left" },
  { value: "center", labelKey: "center" },
  { value: "right", labelKey: "right" },
];

const notificationAnimationOptionDefs = [
  { value: "right-to-left", labelKey: "rightToLeft" },
  { value: "left-to-right", labelKey: "leftToRight" },
];

const notificationAccentOptionDefs = [
  { value: "left", labelKey: "left" },
  { value: "right", labelKey: "right" },
  { value: "top", labelKey: "top" },
  { value: "bottom", labelKey: "bottom" },
];

const playerAlignmentOptionDefs = [
  { value: "left", labelKey: "left" },
  { value: "right", labelKey: "right" },
  { value: "horizontal", labelKey: "horizontal" },
];

const playerDisplayOptionDefs = [
  { value: "icon-name", labelKey: "iconName" },
  { value: "icon", labelKey: "iconOnly" },
];

const REFRESH_MS = Number(import.meta.env.VITE_OVERLAY_REFRESH_MS || 3000);

function getOptionLabels(defs, t) {
  return defs.map((option) => ({
    value: option.value,
    label: t(`obsConfig.options.${option.labelKey}`),
  }));
}

function getPreviewOverlay(t) {
  return {
    challenge_name: t("obsConfig.sampleChallenge"),
    map: { name: "Crystal Isles" },
    current_lives: 7,
    initial_lives: 10,
    completed_dinos_count: 4,
    total_dinos_count: 10,
    players: [
      { id: 1, name: "IRkwu", player_name: "IRkwu" },
      { id: 2, name: "Hetorelan", player_name: "Hetorelan" },
    ],
  };
}

function getPreviewEvents(t) {
  return [
    {
      id: "preview-dino-tamed",
      id_event: "preview-dino-tamed",
      event_type: "dino_tamed",
      player_name: "IRkwu",
      dino_name: "Allosaurus",
      lives_after: 7,
      message: t("obsConfig.dinoTamed"),
      created_at: new Date().toISOString(),
    },
  ];
}

function clampPositionOffset(value, max) {
  return Math.max(0, Math.min(Math.max(0, max), Math.round(value)));
}

function getMovedOffset(position, deltaX, deltaY) {
  const movesFromRight = position.anchor.includes("right");
  const movesFromBottom = position.anchor.includes("bottom");

  return {
    offsetX: position.offsetX + (movesFromRight ? -deltaX : deltaX),
    offsetY: position.offsetY + (movesFromBottom ? -deltaY : deltaY),
  };
}

function getDraggedPosition(position, deltaX, deltaY, resolution, widgetBox) {
  const nextOffset = getMovedOffset(position, deltaX, deltaY);
  const maxOffsetX = resolution.width - widgetBox.width;
  const maxOffsetY = resolution.height - widgetBox.height;

  return {
    ...position,
    offsetX: clampPositionOffset(nextOffset.offsetX, maxOffsetX),
    offsetY: clampPositionOffset(nextOffset.offsetY, maxOffsetY),
  };
}

function getEstimatedWidgetBox(widgetKey, widget, resolutionScale) {
  const widgetScale = resolutionScale * widget.size;
  const width = Math.max(widget.width, widget.minWidth || 0) * widgetScale;
  const baseHeights = {
    title: 64,
    lives: 88,
    dinos: 44,
    notifications: Math.max(1, widget.maxVisible || 1) * 86,
    players: widget.align === "horizontal" || widget.layout === "horizontal" ? 78 : 68,
  };
  const height = (baseHeights[widgetKey] || 80) * widgetScale;

  return {
    width,
    height,
  };
}

export default function OverlayConfigPage() {
  const { t } = useI18n();
  const { info } = useNotifications();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const previewChallengeId = searchParams.get("previewChallenge");
  const showFirstObsNotice = searchParams.get("firstObsConfig") === "1";
  const previewRef = useRef(null);
  const dragRef = useRef(null);
  const [overlay, setOverlay] = useState(() => getPreviewOverlay(t));
  const [events, setEvents] = useState(() => getPreviewEvents(t));
  const [previewNotification, setPreviewNotification] = useState(null);
  const [scale, setScale] = useState(0);
  const [previewBox, setPreviewBox] = useState({ width: 0, height: 0 });
  const [config, setConfig] = useState(() =>
    readGlobalOverlayConfig(defaultOverlayConfig.id)
  );
  const resolution = config.resolution;
  const resolutionScale = getOverlayBaseScale(config);
  const { nextRequestId, isCurrentRequest } = useStaleRequestGuard();

  const load = useCallback(async () => {
    if (!previewChallengeId) {
      setOverlay(getPreviewOverlay(t));
      setEvents(getPreviewEvents(t));
      return;
    }

    const requestId = nextRequestId();
    const [overlayData, eventData] = await Promise.all([
      overlayService.getOverlay(previewChallengeId, { recent_limit: 5 }),
      overlayService.listEvents(previewChallengeId, { limit: 12 }),
    ]);

    if (isCurrentRequest(requestId)) {
      setOverlay(overlayData);
      setEvents(eventData);
    }
  }, [isCurrentRequest, nextRequestId, previewChallengeId, t]);

  useEffect(() => {
    setConfig(readGlobalOverlayConfig(defaultOverlayConfig.id));
  }, []);

  useEffect(() => {
    if (showFirstObsNotice) {
      info(t("obsConfig.firstNotice"));
    }
  }, [info, showFirstObsNotice, t]);

  useEffect(() => {
    load().catch(() => {});
    const timer = window.setInterval(() => load().catch(() => {}), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useLayoutEffect(() => {
    const element = previewRef.current;
    let frameId = 0;

    if (!element) {
      return undefined;
    }

    function updateScale() {
      const bounds = element.getBoundingClientRect();
      const width = element.clientWidth || bounds.width;
      const height = element.clientHeight || bounds.height;

      if (!width || !height) {
        frameId = window.requestAnimationFrame(updateScale);
        return;
      }

      const ratio = resolution.width / resolution.height;
      let frameWidth = width;
      let frameHeight = Math.round(frameWidth / ratio);

      if (frameHeight > height) {
        frameHeight = height;
        frameWidth = Math.round(frameHeight * ratio);
      }

      setPreviewBox((prevBox) =>
        prevBox.width === frameWidth && prevBox.height === frameHeight
          ? prevBox
          : { width: frameWidth, height: frameHeight }
      );

      const nextScale = frameWidth / resolution.width;
      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 0);
    }

    function scheduleUpdate() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateScale);
    }

    scheduleUpdate();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [resolution.height, resolution.width]);

  useChallengeSocket(previewChallengeId, () => {
    load().catch(() => {});
  });

  const updateConfig = useCallback((updater) => {
    setConfig((prev) => {
      const nextConfig = normalizeOverlayConfig(
        typeof updater === "function" ? updater(prev) : updater
      );

      saveGlobalOverlayConfig(nextConfig);
      return nextConfig;
    });
  }, []);

  const updateWidget = useCallback((widgetKey, patch) => {
    updateConfig((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetKey]: {
          ...prev.widgets[widgetKey],
          ...patch,
        },
      },
      widgetsByFormat: patch.position
        ? {
            ...(prev.widgetsByFormat || {}),
            [prev.resolution.preset]: {
              ...(prev.widgetsByFormat?.[prev.resolution.preset] || {}),
              [widgetKey]: {
                ...(prev.widgetsByFormat?.[prev.resolution.preset]?.[widgetKey] || {}),
                position: patch.position,
              },
            },
          }
        : prev.widgetsByFormat,
    }));
  }, [updateConfig]);

  function resetConfig() {
    updateConfig(defaultOverlayConfig);
  }

  function simulateNotification() {
    setPreviewNotification({
      id_event: `preview-notification-${Date.now()}`,
      event_type: "dino_tamed",
      player_name: "IRkwu",
      dino_name: "Carcharadontosaurio",
      lives_after: 7,
      message: t("obsConfig.dinoTamed"),
    });
  }

  function updateResolution(patch) {
    updateConfig((prev) => {
      const preset = patch.preset || prev.resolution.preset;
      const presetConfig = overlayResolutionPresets.find((option) => option.id === preset);

      return {
        ...prev,
        resolution: {
          ...prev.resolution,
          preset: presetConfig?.id || "16:9",
          label: presetConfig?.id || "16:9",
        },
      };
    });
  }

  function selectResolutionPreset(presetId) {
    const preset = overlayResolutionPresets.find((option) => option.id === presetId);

    if (!preset) {
      return;
    }

    updateResolution({
      preset: preset.id,
    });
  }

  function startDragging(event, widgetKey) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const widget = config.widgets[widgetKey];
    const bounds = event.currentTarget.getBoundingClientRect();
    const widgetBox = {
      width: scale ? bounds.width / scale : widget.width,
      height: scale ? bounds.height / scale : 60,
    };

    dragRef.current = {
      type: "move",
      widgetKey,
      pointerX: event.clientX,
      pointerY: event.clientY,
      position: widget.position,
      widgetBox,
    };
  }

  function startResizing(event, widgetKey) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const widget = config.widgets[widgetKey];
    dragRef.current = {
      type: "resize",
      widgetKey,
      pointerX: event.clientX,
      pointerY: event.clientY,
      size: widget.size,
    };
  }

  useEffect(() => {
    function handlePointerMove(event) {
      const drag = dragRef.current;

      if (!drag) {
        return;
      }

      if (!scale) {
        return;
      }

      const deltaX = (event.clientX - drag.pointerX) / scale;
      const deltaY = (event.clientY - drag.pointerY) / scale;
      if (drag.type === "resize") {
        const delta = Math.max(deltaX, deltaY);
        const rawSize = drag.size + delta / 360;
        const steppedSize = Math.round(rawSize / 0.05) * 0.05;
        const nextSize = Math.min(
          OVERLAY_MAX_WIDGET_SCALE,
          Math.max(OVERLAY_MIN_WIDGET_SCALE, steppedSize)
        );

        updateWidget(drag.widgetKey, { size: nextSize });
        return;
      }

      updateWidget(drag.widgetKey, {
        position: getDraggedPosition(
          drag.position,
          deltaX,
          deltaY,
          resolution,
          drag.widgetBox
        ),
      });
    }

    function handlePointerUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [resolution, scale, updateWidget]);

  const playersCount = overlay.players?.length ?? 0;

  return (
    <main className="overlay-config-page">
      <section className="overlay-config-sidebar">
        <div className="overlay-config-head">
          <div>
            <div className="h1">{t("obsConfig.title")}</div>
            <p className="muted">{t("obsConfig.subtitle")}</p>
          </div>
          <div className="overlay-config-head-actions">
            <button className="btn ghost" type="button" onClick={() => navigate("/")} title={t("obsConfig.backTitle")} aria-label={t("obsConfig.backTitle")}>
              <Icon icon="mdi:arrow-left" width={18} aria-hidden="true" />
              {t("obsConfig.back")}
            </button>
            <button className="btn ghost" type="button" onClick={resetConfig} title={t("obsConfig.resetTitle")} aria-label={t("obsConfig.resetTitle")}>
              <Icon icon="mdi:restore" width={18} aria-hidden="true" />
              {t("common.reset")}
            </button>
          </div>
        </div>

        <div className="overlay-url-card">
          <div className="overlay-resolution-card">
            <AppSelect
              label={t("obsConfig.format")}
              value={resolution.preset}
              options={overlayResolutionPresets}
              onChange={selectResolutionPreset}
            />
            <p className="overlay-scale-summary">{t("obsConfig.scaleSummary", { scale: resolutionScale.toFixed(2) })}</p>
          </div>
          <p className="muted">{t("obsConfig.urlHelp")}</p>
        </div>

        <div className="overlay-widget-settings">
          {overlayWidgetOrder.map((widgetKey) => (
            <WidgetControls
              key={widgetKey}
              widgetKey={widgetKey}
              widget={config.widgets[widgetKey]}
              playersCount={playersCount}
              maxX={resolution.width}
              maxY={resolution.height}
              resolutionScale={resolutionScale}
              onChange={(patch) => updateWidget(widgetKey, patch)}
              onPreviewNotification={simulateNotification}
              t={t}
            />
          ))}
        </div>
      </section>

      <section className="overlay-preview-panel">
        <div className="overlay-preview-head">
          <div>
            <div className="h2">{t("obsConfig.preview", { width: resolution.width, height: resolution.height })}</div>
            <p className="muted">{t("obsConfig.previewHelp")}</p>
          </div>
        </div>
        <div
          className="overlay-preview-viewport"
          ref={previewRef}
          style={{ aspectRatio: `${resolution.width} / ${resolution.height}` }}
        >
          <div
            className="overlay-preview-frame"
            style={{
              width: previewBox.width,
              height: previewBox.height,
            }}
          >
            <div
              className="overlay-preview-stage"
              style={{
                width: resolution.width,
                height: resolution.height,
                transform: `scale(${scale})`,
                visibility: scale > 0 ? "visible" : "hidden",
              }}
            >
              <OverlayRenderer
                overlay={overlay}
                events={events}
                config={config}
                challengeKey={previewChallengeId || "global-preview"}
                preview
                previewNotification={previewNotification}
                onWidgetPointerDown={startDragging}
                onWidgetResizePointerDown={startResizing}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function WidgetControls({ widgetKey, widget, playersCount = 1, maxX, maxY, resolutionScale, onChange, onPreviewNotification, t }) {
  const isNotificationWidget = widgetKey === "notifications";
  const isLimitedList = widgetKey === "notifications";
  const canConfigureAlignment = widgetKey !== "lives" && widgetKey !== "dinos" && widgetKey !== "players";
  const canConfigureMap = widgetKey === "title";
  const canConfigureWidth = widgetKey !== "lives" && widgetKey !== "dinos";
  const widthLimits = getOverlayWidgetWidthLimits(widgetKey, widget, playersCount);
  const position = widget.position || { anchor: "top-left", offsetX: widget.x || 0, offsetY: widget.y || 0 };
  const widgetBox = getEstimatedWidgetBox(widgetKey, widget, resolutionScale);
  const maxOffsetX = Math.max(0, Math.round(maxX - widgetBox.width));
  const maxOffsetY = Math.max(0, Math.round(maxY - widgetBox.height));
  const controlGridClass = `overlay-control-grid ${
    canConfigureAlignment && canConfigureMap ? "two always-inline" : "single"
  }`.trim();
  const positionGridClass = `overlay-control-grid position-control-grid ${canConfigureWidth ? "with-width" : "without-width"}`;

  return (
    <section className="overlay-widget-control">
      <div className="overlay-widget-control-head">
        <label className="settings-toggle">
          <span>{t(`obsConfig.widgets.${widgetKey}`)}</span>
          <input
            type="checkbox"
            checked={widget.visible}
            onChange={(event) => onChange({ visible: event.target.checked })}
          />
        </label>
      </div>

      <div className={positionGridClass}>
        <NumberControl
          label="X"
          value={position.offsetX}
          min={0}
          max={maxOffsetX}
          onChange={(offsetX) => onChange({ position: { ...position, offsetX } })}
        />
        <NumberControl
          label="Y"
          value={position.offsetY}
          min={0}
          max={maxOffsetY}
          onChange={(offsetY) => onChange({ position: { ...position, offsetY } })}
        />
        {canConfigureWidth ? (
          <NumberControl
            label={t("obsConfig.width")}
            value={widget.width}
            min={widthLimits.minWidth || 0}
            max={widthLimits.maxWidth}
            onChange={(width) => onChange({ width })}
          />
        ) : null}
      </div>

      <RangeControl
        label={t(`obsConfig.sizes.${widgetKey}`) || t("obsConfig.sizes.fallback")}
        value={widget.size}
        min={OVERLAY_MIN_WIDGET_SCALE}
        max={OVERLAY_MAX_WIDGET_SCALE}
        step={0.05}
        onChange={(size) => onChange({ size })}
      />
      <RangeControl label={t("obsConfig.opacity")} value={widget.opacity} min={0.1} max={1} step={0.05} onChange={(opacity) => onChange({ opacity })} />

      {canConfigureAlignment || canConfigureMap ? (
        <div className={controlGridClass}>
          {canConfigureAlignment ? (
            isNotificationWidget ? (
              <div className="notification-alignment-row">
                <AppSelect
                  label={t("obsConfig.alignment")}
                  value={widget.align}
                  options={getOptionLabels(alignmentOptionDefs, t)}
                  onChange={(align) => onChange({ align })}
                />
                <button
                  className="notification-preview-button"
                  type="button"
                  onClick={onPreviewNotification}
                  title={t("obsConfig.previewNotification")}
                  aria-label={t("obsConfig.previewNotification")}
                >
                  <Icon icon="mdi:play-circle-outline" width={17} aria-hidden="true" />
                  {t("obsConfig.previewNotification")}
                </button>
              </div>
            ) : (
              <AppSelect
                label={t("obsConfig.alignment")}
                value={widget.align}
                options={getOptionLabels(alignmentOptionDefs, t)}
                onChange={(align) => onChange({ align })}
              />
            )
          ) : null}
          {canConfigureMap ? (
            <label className="settings-toggle compact-toggle">
              <span>{t("obsConfig.showMap")}</span>
              <input
                type="checkbox"
                checked={widget.showMap ?? true}
                onChange={(event) => onChange({ showMap: event.target.checked })}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {isNotificationWidget ? (
        <>
          <NumberControl
            label={t("obsConfig.duration")}
            value={Math.round(widget.durationMs / 1000)}
            min={1}
            max={30}
            onChange={(duration) => onChange({ duration, durationMs: duration * 1000 })}
          />
          <div className="overlay-control-grid notification-options">
            <AppSelect
              label={t("obsConfig.animation")}
              value={widget.animationDirection}
              options={getOptionLabels(notificationAnimationOptionDefs, t)}
              onChange={(animationDirection) => onChange({ animationDirection })}
            />
            <AppSelect
              label={t("obsConfig.accent")}
              value={widget.accentPosition}
              options={getOptionLabels(notificationAccentOptionDefs, t)}
              onChange={(accentPosition) => onChange({ accentPosition })}
            />
          </div>
        </>
      ) : null}

      {widgetKey === "players" ? (
        <div className="overlay-control-grid two always-inline">
          <AppSelect
            label={t("obsConfig.alignment")}
            value={widget.align === "horizontal" || widget.layout === "horizontal" ? "horizontal" : widget.align || "left"}
            options={getOptionLabels(playerAlignmentOptionDefs, t)}
            onChange={(align) =>
              onChange({
                align,
                layout: align === "horizontal" ? "horizontal" : "vertical",
                width: getPlayerWidgetWidth(align, widget.displayMode || "icon-name", playersCount),
              })
            }
          />
          <AppSelect
            label={t("obsConfig.display")}
            value={widget.displayMode || "icon-name"}
            options={getOptionLabels(playerDisplayOptionDefs, t)}
            onChange={(displayMode) =>
              onChange({
                displayMode,
                width: getPlayerWidgetWidth(
                  widget.align === "horizontal" || widget.layout === "horizontal" ? "horizontal" : widget.align || "left",
                  displayMode,
                  playersCount
                ),
              })
            }
          />
        </div>
      ) : null}

      {isLimitedList ? (
        <NumberControl
          label={t("obsConfig.maxVisible")}
          value={widget.maxVisible}
          min={1}
          max={5}
          onChange={(maxVisible) => onChange({ maxVisible })}
        />
      ) : null}
    </section>
  );
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function NumberControl({ label, value, min, max, step = 1, suffix = "", onChange, disabled = false }) {
  const numericValue = Number.isFinite(value) ? value : min;

  return (
    <label className="field-label overlay-number-field">
      <span>{label}</span>
      <div className="overlay-number-control">
        <input
          type="number"
          min={min}
          max={max}
          disabled={disabled}
          value={Number.isFinite(value) ? value : ""}
          onChange={(event) => onChange(clampNumber(Number(event.target.value), min, max))}
        />
        <div className="overlay-number-stepper">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || numericValue >= max}
            onClick={() => onChange(clampNumber(numericValue + step, min, max))}
          >
            <Icon icon="mdi:chevron-up" width={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || numericValue <= min}
            onClick={() => onChange(clampNumber(numericValue - step, min, max))}
          >
            <Icon icon="mdi:chevron-down" width={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      {suffix ? <small>{suffix}</small> : null}
    </label>
  );
}

function RangeControl({ label, value, min, max, step, onChange }) {
  const progress = ((Number(value) - min) / (max - min)) * 100;

  return (
    <label className="overlay-range-control">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--range-progress": `${Math.max(0, Math.min(100, progress))}%` }}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <b>{Number(value).toFixed(2)}</b>
    </label>
  );
}
