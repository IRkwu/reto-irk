import { useI18n } from "../../i18n";
import "./StatusBadge.css";

export default function StatusBadge({ status }) {
  const { t } = useI18n();
  const label = status ? t(`status.${status}`) : t("common.noStatus");

  return <span className={`app-badge status-badge ${status || ""}`.trim()}>{label}</span>;
}
