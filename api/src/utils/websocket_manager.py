from collections import defaultdict

from fastapi import WebSocket

class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, challenge_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[challenge_id].append(websocket)

    def disconnect(self, challenge_id: int, websocket: WebSocket) -> None:
        connections = self.active_connections.get(challenge_id, [])

        if websocket in connections:
            connections.remove(websocket)

        if not connections and challenge_id in self.active_connections:
            del self.active_connections[challenge_id]

    async def broadcast(self, challenge_id: int, payload: dict) -> None:
        disconnected: list[WebSocket] = []

        for websocket in self.active_connections.get(challenge_id, []):
            try:
                await websocket.send_json(payload)
            except RuntimeError:
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(challenge_id, websocket)

websocket_manager = WebSocketManager()
