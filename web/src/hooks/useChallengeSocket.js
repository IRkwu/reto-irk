import { useEffect, useRef } from "react";
import { createChallengeSocket } from "../services/websocketService";

export function useChallengeSocket(challengeId, onMessage) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!challengeId) {
      return undefined;
    }

    const socket = createChallengeSocket(challengeId, {
      onMessage: (message) => {
        if (message?.type === "connected") {
          return;
        }

        onMessageRef.current?.(message);
      },
    });

    return () => socket.close();
  }, [challengeId]);
}
