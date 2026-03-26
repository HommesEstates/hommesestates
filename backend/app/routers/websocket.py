"""WebSocket router for real-time communication."""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.websocket_service import websocket_endpoint

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/connect")
async def websocket_connect(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time communication."""
    await websocket_endpoint(websocket, token, db)


@router.get("/status")
async def websocket_status():
    """Get WebSocket connection status."""
    from ..services.websocket_service import manager
    
    return {
        "connected_users": manager.get_connected_users(),
        "connection_count": manager.get_connection_count(),
        "active_connections": len(manager.active_connections),
        "room_subscriptions": {
            room: len(users) for room, users in manager.room_subscriptions.items()
        }
    }
