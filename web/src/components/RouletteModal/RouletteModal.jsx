import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import "./RouletteModal.css";

const ITEM_WIDTH = 132;
const ITEM_GAP = -8;
const STRIDE = ITEM_WIDTH + ITEM_GAP;
const SPIN_DURATION = 5200;
const VISUAL_ROLL_LENGTH = 96;
const VISUAL_TAIL_LENGTH = 32;
const SPIN_START_INDEX = 18;
const INITIAL_VISUAL_LENGTH = 56;

function getItemName(item) {
  return item?.name || item?.label || "Resultado";
}

function easeOutQuart(progress) {
  return 1 - Math.pow(1 - progress, 4);
}

function buildRandomSequence(pool, length) {
  const sequence = [];
  let previousIndex = -1;

  for (let index = 0; index < length; index += 1) {
    let randomIndex = Math.floor(Math.random() * pool.length);

    if (pool.length > 1 && randomIndex === previousIndex) {
      randomIndex = (randomIndex + 1) % pool.length;
    }

    sequence.push(pool[randomIndex]);
    previousIndex = randomIndex;
  }

  return sequence;
}

function buildVisualSequence(pool, picked) {
  return [
    ...buildRandomSequence(pool, VISUAL_ROLL_LENGTH),
    picked ?? pool[0],
    ...buildRandomSequence(pool, VISUAL_TAIL_LENGTH),
  ];
}

export default function RouletteModal({
  open,
  pool,
  result,
  title = "Ruleta",
  emptyText = "Sin opciones disponibles",
  assignLabel = "Asignar resultado",
  onRoll,
  onAssign,
  onClose,
}) {
  const [spinning, setSpinning] = useState(false);
  const [offset, setOffset] = useState(0);
  const [display, setDisplay] = useState("Lista para girar");
  const [winningItemId, setWinningItemId] = useState(null);
  const [winningIndex, setWinningIndex] = useState(null);
  const [visualPool, setVisualPool] = useState([]);
  const animationFrameRef = useRef(null);
  const repeatedPool = useMemo(() => {
    if (!pool.length) {
      return [];
    }

    return buildRandomSequence(pool, INITIAL_VISUAL_LENGTH);
  }, [pool]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setOffset(SPIN_START_INDEX * STRIDE);
    setDisplay("Lista para girar");
    setWinningItemId(null);
    setWinningIndex(null);
    setVisualPool(repeatedPool);
  }, [open, repeatedPool]);

  useEffect(() => () => window.cancelAnimationFrame(animationFrameRef.current), []);

  async function handleRoll() {
    if (spinning || pool.length === 0) {
      return;
    }

    setSpinning(true);
    setDisplay("Girando...");
    setWinningItemId(null);
    setWinningIndex(null);
    window.cancelAnimationFrame(animationFrameRef.current);

    try {
      const response = await onRoll();
      const picked = response?.dino || response?.item || response;
      const sequence = buildVisualSequence(pool, picked);
      const targetIndex = VISUAL_ROLL_LENGTH;
      const startOffset = SPIN_START_INDEX * STRIDE;
      const targetOffset = targetIndex * STRIDE;
      let startedAt = null;

      setVisualPool(sequence);
      setOffset(startOffset);

      const animate = (timestamp) => {
        if (!startedAt) {
          startedAt = timestamp;
        }

        const progress = Math.min((timestamp - startedAt) / SPIN_DURATION, 1);
        const nextOffset = startOffset + (targetOffset - startOffset) * easeOutQuart(progress);
        setOffset(nextOffset);

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
          return;
        }

        setOffset(targetOffset);
        setSpinning(false);
        setWinningItemId(picked?.id ?? null);
        setWinningIndex(targetIndex);
        setDisplay(`Salio: ${getItemName(picked)}`);
      };

      animationFrameRef.current = window.requestAnimationFrame(animate);
    } catch (err) {
      window.cancelAnimationFrame(animationFrameRef.current);
      setSpinning(false);
      setDisplay(err.message || "No se pudo girar");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="roulette-overlay" onClick={() => !spinning && onClose()}>
      <div className="roulette-modal" onClick={(event) => event.stopPropagation()}>
        <div className="roulette-header">
          <div>
            <div className="h2">{title}</div>
            <div className="muted">{pool.length ? `${pool.length} opciones` : emptyText}</div>
          </div>
          <button
            className="btn ghost icon-only"
            type="button"
            onClick={onClose}
            disabled={spinning}
            title={`Cerrar ${title}`}
            aria-label={`Cerrar ${title}`}
          >
            <Icon icon="mdi:close" width={20} aria-hidden="true" />
          </button>
        </div>

        <div className="roulette-strip">
          <div className="roulette-marker" />
          <div
            className={`roulette-track ${spinning ? "spinning" : ""}`}
            style={{ transform: `translateX(calc(50% - ${ITEM_WIDTH / 2}px - ${offset}px))` }}
          >
            {visualPool.map((item, index) => {
              const isWinner = winningItemId === item.id && index === winningIndex;
              const distance = Math.min(Math.abs(index * STRIDE - offset) / STRIDE, 4);
              const scale = Math.max(0.66, 1.1 - distance * 0.12);
              const opacity = Math.max(0.3, 1 - distance * 0.16);
              const zIndex = Math.round((5 - distance) * 10);

              return (
                <div
                  className={`roulette-item ${isWinner ? "winner" : ""}`}
                  key={`${item?.id ?? "option"}-${index}`}
                  style={{
                    "--roulette-scale": scale,
                    "--roulette-opacity": opacity,
                    zIndex,
                  }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" />
                  ) : (
                    <span className="roulette-item-icon">
                      <Icon icon="mdi:map-marker-radius-outline" width={22} aria-hidden="true" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="roulette-center-text">{display}</div>

        <div className="row">
          <button
            className="btn"
            type="button"
            onClick={handleRoll}
            disabled={spinning || pool.length === 0}
            title="Girar ruleta"
            aria-label="Girar ruleta"
          >
            {spinning ? "Girando..." : "Girar"}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={onAssign}
            disabled={spinning || !result}
            title={assignLabel}
            aria-label={assignLabel}
          >
            {assignLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
