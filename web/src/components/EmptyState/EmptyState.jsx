import "./EmptyState.css";
export default function EmptyState({ title, text, action }) {
  return (
    <div className="card empty-state">
      <div className="h2">{title}</div>
      {text ? <p className="muted">{text}</p> : null}
      {action}
    </div>
  );
}
