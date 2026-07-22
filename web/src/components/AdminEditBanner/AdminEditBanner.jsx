import { Icon } from "../AppIcon/AppIcon.jsx";
import { useI18n } from "../../i18n";
import "./AdminEditBanner.css";

export default function AdminEditBanner({ text }) {
  const { t } = useI18n();

  return (
    <section className="admin-edit-banner" aria-label={t("common.editModeActive")}>
      <Icon icon="mdi:pencil-outline" width={18} aria-hidden="true" />
      <div>
        <b>{t("common.editModeActive")}</b>
        <span>{text}</span>
      </div>
    </section>
  );
}
