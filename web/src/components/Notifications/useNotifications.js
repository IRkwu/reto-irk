import { useContext } from "react";
import { NotificationContext } from "./NotificationContext";

const noop = () => {};

export function useNotifications() {
  return useContext(NotificationContext) || {
    notify: noop,
    success: noop,
    info: noop,
    error: noop,
  };
}
