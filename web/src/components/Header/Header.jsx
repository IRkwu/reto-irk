import { Link, NavLink } from "react-router-dom";
import { Icon } from "../AppIcon/AppIcon.jsx";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../i18n";
import SettingsPanel from "../SettingsPanel/SettingsPanel.jsx";
import "./Header.css";

export default function Header({ title, actions }) {
  const { logout } = useAuth();
  const { t } = useI18n();

  return (
    <header className="topbar topbar-style-clean">
      <div className="topbar-left">
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Icon icon="mdi:shield-sword" width={20} aria-hidden="true" />
          </span>
          Reto IRk
        </Link>
        {title ? <span className="sep">/</span> : null}
        {title ? <span className="title">{title}</span> : null}
      </div>

      <nav className="topbar-nav">
        <NavLink to="/">{t("nav.challenges")}</NavLink>
        <NavLink to="/players">{t("nav.players")}</NavLink>
        <NavLink to="/dinos">{t("nav.dinos")}</NavLink>
        <NavLink to="/maps">{t("nav.maps")}</NavLink>
      </nav>

      <div className="topbar-right">
        {actions}
        <SettingsPanel />
        <button className="btn ghost icon-text" type="button" onClick={logout} title={t("nav.logout")} aria-label={t("nav.logout")}>
          <Icon icon="mdi:logout" width={18} aria-hidden="true" />
          <span className="logout-label">{t("nav.logout")}</span>
        </button>
      </div>
    </header>
  );
}
