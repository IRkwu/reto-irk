import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Icon } from "../components/AppIcon/AppIcon.jsx";
import { useAuth } from "../hooks/useAuth";
import { useI18n } from "../i18n";
import "../components/LoadingState/LoadingState.css";

export function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="screen-loader">
        <Icon icon="mdi:loading" width={72} height={72} aria-hidden="true" />
        <span>{t("common.loadingSession")}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
