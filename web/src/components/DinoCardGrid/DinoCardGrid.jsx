import DinoTile from "../DinoTile/DinoTile.jsx";
import "./DinoCardGrid.css";

export default function DinoCardGrid({
  assignments = [],
  getDino,
  busyAssignmentId,
  onAssignmentClick,
  action,
  actionLabel,
  disabled = false,
  emptyContent = null,
  className = "",
}) {
  return (
    <div className={`dino-card-grid ${className}`.trim()}>
      {assignments.length === 0 ? emptyContent : assignments.map((assignment) => {
        const isDisabled =
          typeof disabled === "function" ? disabled(assignment) : disabled;
        const nextActionLabel =
          typeof actionLabel === "function" ? actionLabel(assignment) : actionLabel;

        return (
          <DinoTile
            key={assignment.id}
            dino={assignment.dino || getDino?.(assignment)}
            done={assignment.is_tamed}
            busy={busyAssignmentId === assignment.id}
            disabled={isDisabled}
            onClick={() => onAssignmentClick?.(assignment)}
            action={action}
            actionLabel={nextActionLabel}
          />
        );
      })}
    </div>
  );
}
