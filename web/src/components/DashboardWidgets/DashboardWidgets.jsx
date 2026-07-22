import "./DashboardWidgets.css";
export default function DashboardWidgets({ items = [], className = "" }) {
  return (
    <div className={`dashboard-widgets ${className}`.trim()}>
      {items.map((item) => (
        <div className="dashboard-widget" key={item.label}>
          <span>{item.label}</span>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  );
}
