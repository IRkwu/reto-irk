import "./Skeleton.css";

function Line({ width = "100%", className = "" }) {
  return <span className={`skeleton-line ${className}`.trim()} style={{ "--skeleton-width": width }} />;
}

function Block({ className = "" }) {
  return <span className={`skeleton-block ${className}`.trim()} />;
}

function ChallengeCardSkeleton() {
  return (
    <article className="card skeleton-card skeleton-challenge-card" aria-hidden="true">
      <div className="skeleton-card-head">
        <div className="skeleton-copy">
          <Line width="58%" className="title" />
          <Line width="42%" />
        </div>
        <Block className="skeleton-pill" />
      </div>
      <div className="skeleton-metric-row">
        <Block />
        <Block />
      </div>
      <div className="skeleton-action-row">
        <Block />
        <Block />
      </div>
    </article>
  );
}

function DinoCardSkeleton() {
  return (
    <article className="card skeleton-card skeleton-dino-card" aria-hidden="true">
      <Block className="skeleton-image" />
      <div className="skeleton-copy">
        <Line width="70%" className="title" />
        <Line width="56%" />
      </div>
      <div className="skeleton-action-row compact">
        <Block />
        <Block />
      </div>
    </article>
  );
}

function MapCardSkeleton() {
  return (
    <article className="skeleton-map-card" aria-hidden="true">
      <Block className="skeleton-map-image" />
      <Line width="76%" />
      <Line width="46%" className="pill" />
    </article>
  );
}

function PlayerCardSkeleton() {
  return (
    <article className="card skeleton-card skeleton-player-card" aria-hidden="true">
      <div className="skeleton-card-head">
        <Block className="skeleton-avatar" />
        <div className="skeleton-copy">
          <Line width="54%" className="title" />
          <Line width="34%" />
        </div>
        <div className="skeleton-action-row compact">
          <Block />
          <Block />
          <Block />
        </div>
      </div>
      <div className="skeleton-stat-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <Block key={index} />
        ))}
      </div>
    </article>
  );
}

function PlaySkeleton() {
  return (
    <div className="play-shell skeleton-page" aria-hidden="true">
      <section className="card skeleton-card skeleton-lives-card">
        <div className="skeleton-copy">
          <Line width="28%" />
          <Line width="18%" className="hero-number" />
          <Line width="36%" />
        </div>
        <div className="skeleton-action-row">
          <Block />
          <Block />
          <Block />
        </div>
      </section>
      <div className="skeleton-play-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <article className="card skeleton-card skeleton-play-player" key={index}>
            <div className="skeleton-card-head">
              <Block className="skeleton-avatar" />
              <div className="skeleton-copy">
                <Line width="58%" className="title" />
                <Line width="72%" />
              </div>
              <Block className="skeleton-pill" />
            </div>
            <div className="skeleton-mini-grid">
              {Array.from({ length: 6 }).map((__, itemIndex) => (
                <Block key={itemIndex} />
              ))}
            </div>
          </article>
        ))}
      </div>
      <section className="card skeleton-card skeleton-events-card">
        <Line width="32%" className="title" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="skeleton-event-row" key={index}>
            <Block className="skeleton-event-icon" />
            <div className="skeleton-copy">
              <Line width="72%" />
              <Line width="48%" />
            </div>
            <Block className="skeleton-pill" />
          </div>
        ))}
      </section>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="editor-shell skeleton-page" aria-hidden="true">
      <section className="card skeleton-card skeleton-editor-config">
        <div className="skeleton-card-head">
          <div className="skeleton-copy">
            <Line width="46%" className="title" />
            <Line width="30%" />
          </div>
          <div className="skeleton-action-row">
            <Block />
            <Block />
          </div>
        </div>
        <Line width="100%" className="input" />
      </section>
      <div className="skeleton-play-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <article className="card skeleton-card skeleton-play-player" key={index}>
            <div className="skeleton-card-head">
              <Block className="skeleton-avatar" />
              <div className="skeleton-copy">
                <Line width="56%" className="title" />
                <Line width="68%" />
              </div>
              <Block className="skeleton-pill" />
            </div>
            <div className="skeleton-editor-controls">
              <Block />
              <Block />
              <Block />
            </div>
            <div className="skeleton-mini-grid">
              {Array.from({ length: 5 }).map((__, itemIndex) => (
                <Block key={itemIndex} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function OverlaySkeleton() {
  return (
    <div className="obs-root skeleton-overlay" aria-hidden="true">
      <Block className="skeleton-obs-panel" />
      <Block className="skeleton-obs-lives" />
      <Block className="skeleton-obs-progress" />
      <div className="skeleton-obs-toasts">
        <Block />
        <Block />
        <Block />
      </div>
    </div>
  );
}

export default function Skeleton({ variant = "cards", count = 4 }) {
  if (variant === "play") {
    return <PlaySkeleton />;
  }

  if (variant === "editor") {
    return <EditorSkeleton />;
  }

  if (variant === "overlay") {
    return <OverlaySkeleton />;
  }

  const CardComponent = {
    cards: ChallengeCardSkeleton,
    dinos: DinoCardSkeleton,
    maps: MapCardSkeleton,
    players: PlayerCardSkeleton,
  }[variant] || ChallengeCardSkeleton;

  const gridClass = {
    cards: "challenge-card-grid",
    dinos: "dinos-admin-grid",
    maps: "maps-card-grid",
    players: "players-admin-grid",
  }[variant] || "challenge-card-grid";

  return (
    <div className="skeleton-page" aria-label="Cargando contenido">
      <div className={`${gridClass} skeleton-grid`}>
        {Array.from({ length: count }).map((_, index) => (
          <CardComponent key={index} />
        ))}
      </div>
      {variant === "maps" ? (
        <div className="maps-detail-grid skeleton-map-details">
          <section className="card skeleton-card"><Line width="42%" className="title" /><Block className="skeleton-detail-block" /></section>
          <section className="card skeleton-card"><Line width="38%" className="title" /><Block className="skeleton-detail-block" /></section>
        </div>
      ) : null}
    </div>
  );
}
