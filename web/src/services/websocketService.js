const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  API_BASE_URL?.replace(/^http/i, (protocol) =>
    protocol.toLowerCase() === "https" ? "wss" : "ws"
  );
const WS_CONFIG_ERROR =
  "Falta configurar VITE_WS_URL o VITE_API_BASE_URL para conectar el WebSocket.";

export function createChallengeSocket(challengeId, handlers = {}) {
  if (!WS_BASE_URL) {
    handlers.onError?.(new Error(WS_CONFIG_ERROR));
    return {
      close: () => {},
    };
  }

  const socket = new WebSocket(`${WS_BASE_URL}/ws/challenges/${challengeId}`);

  socket.onopen = handlers.onOpen || null;
  socket.onerror = handlers.onError || null;
  socket.onclose = handlers.onClose || null;
  socket.onmessage = (event) => {
    try {
      handlers.onMessage?.(JSON.parse(event.data));
    } catch {
      handlers.onMessage?.({ type: "message", raw: event.data });
    }
  };

  return {
    close: () => {
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.onopen = () => socket.close();
        socket.onerror = null;
        socket.onmessage = null;
        return;
      }

      socket.close();
    },
  };
}
