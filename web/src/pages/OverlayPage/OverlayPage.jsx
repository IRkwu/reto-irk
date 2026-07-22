import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import OverlayRenderer from "../../components/OverlayRenderer/OverlayRenderer.jsx";
import Skeleton from "../../components/Skeleton/Skeleton.jsx";
import { useChallengeSocket } from "../../hooks/useChallengeSocket";
import { useStaleRequestGuard } from "../../hooks/useStaleRequestGuard";
import { overlayService } from "../../services/overlayService";
import { applyOverlayAppearance, getOverlayConfigFromSearch } from "../../utils/overlayConfig";
import "./OverlayPage.css";

const REFRESH_MS = Number(import.meta.env.VITE_OVERLAY_REFRESH_MS || 3000);

export default function OverlayPage() {
  const { challengeId } = useParams();
  const [searchParams] = useSearchParams();
  const [overlay, setOverlay] = useState(null);
  const [events, setEvents] = useState([]);
  const config = useMemo(
    () => getOverlayConfigFromSearch(challengeId, searchParams),
    [challengeId, searchParams]
  );
  const { nextRequestId, isCurrentRequest } = useStaleRequestGuard();

  useEffect(() => {
    applyOverlayAppearance(config);
  }, [config]);

  const load = useCallback(async () => {
    const requestId = nextRequestId();
    const eventLimit = Math.max(
      config.widgets.notifications.maxVisible,
      8
    );
    const [overlayData, eventData] = await Promise.all([
      overlayService.getOverlay(challengeId, { recent_limit: 5 }),
      overlayService.listEvents(challengeId, { limit: eventLimit }),
    ]);

    if (isCurrentRequest(requestId)) {
      setOverlay(overlayData);
      setEvents(eventData);
    }
  }, [challengeId, config, isCurrentRequest, nextRequestId]);

  useEffect(() => {
    load().catch(() => {});
    const timer = window.setInterval(() => load().catch(() => {}), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useChallengeSocket(challengeId, () => {
    load().catch(() => {});
  });

  if (!overlay) {
    return <Skeleton variant="overlay" />;
  }

  return (
    <OverlayRenderer
      overlay={overlay}
      events={events}
      config={config}
      challengeKey={challengeId}
    />
  );
}
