import { useCallback, useMemo, useRef, useState } from "react";
import { Icon } from "../AppIcon/AppIcon.jsx";
import { NotificationContext } from "./NotificationContext";
import "./Notifications.css";

const DEFAULT_DURATION_MS = 5000;

const variantIcons = {
  success: "mdi:check-circle-outline",
  info: "mdi:monitor-cog",
  error: "mdi:alert-outline",
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback(({ message, variant = "info", durationMs = DEFAULT_DURATION_MS }) => {
    if (!message) {
      return null;
    }

    const id = nextIdRef.current;
    nextIdRef.current += 1;

    setNotifications((current) => [
      {
        id,
        message,
        variant,
        durationMs,
      },
      ...current,
    ]);

    window.setTimeout(() => dismiss(id), durationMs);
    return id;
  }, [dismiss]);

  const value = useMemo(
    () => ({
      notify,
      success: (message, options = {}) => notify({ ...options, message, variant: "success" }),
      info: (message, options = {}) => notify({ ...options, message, variant: "info" }),
      error: (message, options = {}) => notify({ ...options, message, variant: "error" }),
    }),
    [notify]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notification-viewport" aria-live="polite" aria-atomic="false">
        {notifications.map((notification) => (
          <div
            className={`notification-toast ${notification.variant}`.trim()}
            key={notification.id}
            role="status"
            style={{ "--notification-duration": `${notification.durationMs}ms` }}
          >
            <Icon icon={variantIcons[notification.variant] || variantIcons.info} width={19} aria-hidden="true" />
            <span>{notification.message}</span>
            <span className="notification-timer" aria-hidden="true" />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
