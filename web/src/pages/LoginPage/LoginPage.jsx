import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../../components/AppIcon/AppIcon.jsx";
import { useNotifications } from "../../components/Notifications";
import { useAuth } from "../../hooks/useAuth";
import { useI18n } from "../../i18n";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const { error: notifyError } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      notifyError(err.message || t("login.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page center">
      <div className="authcard card">
        <div className="brand-mark">
          <Icon icon="mdi:shield-sword" width={34} aria-hidden="true" />
          <span>Reto IRk</span>
        </div>
        <div className="h1">{t("login.title")}</div>
        <p className="muted">{t("login.description")}</p>

        <form className="form" onSubmit={handleSubmit}>
          <label>
            <span>{t("login.username")}</span>
            <input
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, username: event.target.value }))
              }
              autoComplete="username"
              autoFocus
            />
          </label>
          <label>
            <span>{t("login.password")}</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              autoComplete="current-password"
            />
          </label>
          <button
            className="btn theme-action-btn"
            type="submit"
            disabled={busy}
            title={t("login.submitTitle")}
            aria-label={t("login.submitTitle")}
          >
            {busy ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
