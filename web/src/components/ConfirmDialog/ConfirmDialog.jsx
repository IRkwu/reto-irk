import { Icon } from "../AppIcon/AppIcon.jsx";
import { useId } from "react";
import { useModalAccessibility } from "../../hooks/useModalAccessibility";
import { useI18n } from "../../i18n";
import "./ConfirmDialog.css";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useI18n();
  const titleId = useId();
  const dialogRef = useModalAccessibility(open, loading ? undefined : onCancel);
  const nextTitle = title || t("common.confirmAction");
  const nextConfirmLabel = confirmLabel || t("common.accept");
  const nextCancelLabel = cancelLabel === undefined ? t("common.cancel") : cancelLabel;

  if (!open) {
    return null;
  }

  const icon = variant === "danger" ? "mdi:alert-outline" : "mdi:help-circle-outline";

  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={loading ? undefined : (event) => event.target === event.currentTarget && onCancel?.()}>
      <section
        className="confirm-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`confirm-icon ${variant}`}>
          <Icon icon={icon} width={24} aria-hidden="true" />
        </div>
        <div className="confirm-content">
          <div className="h2" id={titleId}>{nextTitle}</div>
          {message ? <p>{message}</p> : null}
        </div>
        <div className="confirm-actions">
          {nextCancelLabel ? (
            <button
              className="btn ghost"
              type="button"
              disabled={loading}
              onClick={onCancel}
              title={nextCancelLabel}
              aria-label={nextCancelLabel}
            >
              {nextCancelLabel}
            </button>
          ) : null}
          <button
            className={`btn ${variant === "danger" ? "danger" : ""}`}
            type="button"
            disabled={loading}
              onClick={() => onConfirm?.()}
            title={nextConfirmLabel}
            aria-label={nextConfirmLabel}
          >
            {loading ? t("common.processing") : nextConfirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
