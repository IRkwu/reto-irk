import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NotificationProvider } from "./components/Notifications";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./i18n";
import { applyStoredSettings } from "./utils/settings";
import "./styles/app.css";

applyStoredSettings();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nProvider>
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </I18nProvider>
  </React.StrictMode>
);
