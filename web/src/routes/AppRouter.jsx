import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ChallengeEditorPage from "../pages/ChallengeEditorPage/ChallengeEditorPage.jsx";
import ChallengePlayPage from "../pages/ChallengePlayPage/ChallengePlayPage.jsx";
import ChallengesPage from "../pages/ChallengesPage/ChallengesPage.jsx";
import DinosPage from "../pages/DinosPage/DinosPage.jsx";
import LoginPage from "../pages/LoginPage/LoginPage.jsx";
import MapsPage from "../pages/MapsPage/MapsPage.jsx";
import OverlayConfigPage from "../pages/OverlayConfigPage/OverlayConfigPage.jsx";
import OverlayPage from "../pages/OverlayPage/OverlayPage.jsx";
import PlayersPage from "../pages/PlayersPage/PlayersPage.jsx";
import { GuestOnlyRoute, RequireAuth } from "./RouteGuards";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/obs/:challengeId" element={<OverlayPage />} />
        <Route path="/overlay/:challengeId" element={<OverlayPage />} />

        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/" element={<ChallengesPage />} />
          <Route path="/obs/config" element={<OverlayConfigPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/dinos" element={<DinosPage />} />
          <Route path="/maps" element={<MapsPage />} />
          <Route path="/challenges/:challengeId" element={<ChallengePlayPage />} />
          <Route path="/challenges/:challengeId/edit" element={<ChallengeEditorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
