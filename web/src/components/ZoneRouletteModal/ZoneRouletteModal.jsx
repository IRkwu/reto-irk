import { useEffect, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import "./ZoneRouletteModal.css";

const SHUFFLE_STEPS = 34;

function getItemName(item) {
  return item?.name || item?.label || "Zona";
}

function buildShufflePath(pool, targetIndex) {
  const path = [];
  let previousIndex = -1;

  for (let index = 0; index < SHUFFLE_STEPS; index += 1) {
    let randomIndex = Math.floor(Math.random() * pool.length);

    if (pool.length > 1 && randomIndex === previousIndex) {
      randomIndex = (randomIndex + 1) % pool.length;
    }

    path.push(randomIndex);
    previousIndex = randomIndex;
  }

  return [...path, targetIndex];
}

function shufflePool(pool) {
  return [...pool]
    .map((item) => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

export default function ZoneRouletteModal({
  open,
  pool,
  result,
  title = "Ruleta de zona",
  emptyText = "Sin zonas disponibles",
  assignLabel = "Asignar zona",
  onRoll,
  onAssign,
  onClose,
}) {
  const [spinning, setSpinning] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [winningItemId, setWinningItemId] = useState(null);
  const [display, setDisplay] = useState("Lista para girar");
  const [shuffledPool, setShuffledPool] = useState([]);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setShuffledPool(shufflePool(pool));
    setActiveIndex(null);
    setWinningItemId(null);
    setDisplay("Lista para girar");
  }, [open, pool]);

  useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
  }, []);

  async function handleRoll() {
    if (spinning || pool.length === 0) {
      return;
    }

    setSpinning(true);
    setWinningItemId(null);
    setDisplay("Barajando zonas...");
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];

    try {
      const response = await onRoll();
      const picked = response?.item || response?.spawn_zone || response;
      const targetIndex = Math.max(0, shuffledPool.findIndex((item) => item.id === picked?.id));
      const path = buildShufflePath(shuffledPool, targetIndex);
      let delay = 0;

      path.forEach((index, stepIndex) => {
        delay += 42 + stepIndex * 5;
        const timerId = window.setTimeout(() => {
          setActiveIndex(index);

          if (stepIndex === path.length - 1) {
            setSpinning(false);
            setWinningItemId(picked?.id ?? null);
            setDisplay(`Salio: ${getItemName(picked)}`);
          }
        }, delay);

        timersRef.current.push(timerId);
      });
    } catch (err) {
      setSpinning(false);
      setDisplay(err.message || "No se pudo girar");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="roulette-overlay" onClick={() => !spinning && onClose()}>
      <div className="roulette-modal zone-roulette-modal" onClick={(event) => event.stopPropagation()}>
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

        <div className="zone-random-board">
          {shuffledPool.map((item, index) => {
            const isActive = activeIndex === index;
            const isWinner = winningItemId === item.id;

            return (
              <div
                className={`zone-random-card ${isActive ? "active" : ""} ${isWinner ? "winner" : ""}`}
                key={item.id}
              >
                <Icon icon="mdi:map-marker-radius-outline" width={22} aria-hidden="true" />
                <span>{getItemName(item)}</span>
              </div>
            );
          })}
        </div>

        <div className="roulette-center-text">{display}</div>

        <div className="row">
          <button
            className="btn"
            type="button"
            onClick={handleRoll}
            disabled={spinning || pool.length === 0}
            title="Girar ruleta de zona"
            aria-label="Girar ruleta de zona"
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
