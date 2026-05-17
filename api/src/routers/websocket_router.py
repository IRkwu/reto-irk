from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.utils.websocket_manager import websocket_manager

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/challenges/{challenge_id}")
async def challenge_websocket(websocket: WebSocket, challenge_id: int) -> None:
    await websocket_manager.connect(challenge_id, websocket)
    await websocket.send_json({"type": "connected", "challenge_id": challenge_id})

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(challenge_id, websocket)
