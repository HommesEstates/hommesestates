"""WebSocket service for real-time features."""
import json
import asyncio
from typing import Dict, List, Set, Optional, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import User, Partner, Offer, Payment, Invoice
from ..security import decode_access_token
from ..services.cache_service import cache


class ConnectionManager:
    """Manages WebSocket connections and message broadcasting."""
    
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Store connection metadata
        self.connection_metadata: Dict[WebSocket, Dict] = {}
        # Store room subscriptions
        self.room_subscriptions: Dict[str, Set[int]] = {}  # room_id -> set of user_ids
    
    async def connect(self, websocket: WebSocket, user_id: int, metadata: Dict = None):
        """Accept and store a WebSocket connection."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.connection_metadata[websocket] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        # Send welcome message
        await self.send_personal_message(user_id, {
            "type": "connected",
            "message": "Connected to real-time updates",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Broadcast user online status
        await self.broadcast_user_status(user_id, "online")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.connection_metadata:
            user_id = self.connection_metadata[websocket]["user_id"]
            
            # Remove from active connections
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            
            # Remove metadata
            del self.connection_metadata[websocket]
            
            # Broadcast user offline status
            asyncio.create_task(self.broadcast_user_status(user_id, "offline"))
    
    async def send_personal_message(self, user_id: int, message: Dict):
        """Send a message to all connections for a specific user."""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn)
    
    async def send_to_room(self, room_id: str, message: Dict, exclude_user: Optional[int] = None):
        """Send a message to all users subscribed to a room."""
        if room_id in self.room_subscriptions:
            for user_id in self.room_subscriptions[room_id]:
                if exclude_user and user_id == exclude_user:
                    continue
                await self.send_personal_message(user_id, message)
    
    async def broadcast_to_all(self, message: Dict, exclude_user: Optional[int] = None):
        """Broadcast a message to all connected users."""
        for user_id in list(self.active_connections.keys()):
            if exclude_user and user_id == exclude_user:
                continue
            await self.send_personal_message(user_id, message)
    
    async def broadcast_user_status(self, user_id: int, status: str):
        """Broadcast user online/offline status to relevant users."""
        # Get user's partners/contacts
        message = {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to admin users
        await self.send_to_room("admins", message)
        
        # Broadcast to user's own connections (for status sync)
        await self.send_personal_message(user_id, message)
    
    def subscribe_to_room(self, user_id: int, room_id: str):
        """Subscribe a user to a room."""
        if room_id not in self.room_subscriptions:
            self.room_subscriptions[room_id] = set()
        self.room_subscriptions[room_id].add(user_id)
    
    def unsubscribe_from_room(self, user_id: int, room_id: str):
        """Unsubscribe a user from a room."""
        if room_id in self.room_subscriptions:
            self.room_subscriptions[room_id].discard(user_id)
            if not self.room_subscriptions[room_id]:
                del self.room_subscriptions[room_id]
    
    def get_connected_users(self) -> List[int]:
        """Get list of currently connected user IDs."""
        return list(self.active_connections.keys())
    
    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return sum(len(connections) for connections in self.active_connections.values())


# Global connection manager
manager = ConnectionManager()


class WebSocketMessage(BaseModel):
    """WebSocket message model."""
    type: str
    data: Dict[str, Any] = {}
    room: Optional[str] = None


class RealtimeEventService:
    """Service for handling real-time events and notifications."""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
    
    async def notify_offer_created(self, offer_id: int, partner_id: int):
        """Notify relevant users when an offer is created."""
        message = {
            "type": "offer_created",
            "offer_id": offer_id,
            "partner_id": partner_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Notify the partner
        await self.manager.send_personal_message(partner_id, message)
        
        # Notify admin users
        await self.manager.send_to_room("admins", message)
    
    async def notify_offer_updated(self, offer_id: int, changes: Dict):
        """Notify relevant users when an offer is updated."""
        message = {
            "type": "offer_updated",
            "offer_id": offer_id,
            "changes": changes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Get offer details to determine who to notify
        offer_data = cache.get(f"offer:{offer_id}")
        if offer_data:
            await self.manager.send_personal_message(offer_data["partner_id"], message)
        
        await self.manager.send_to_room("admins", message)
        await self.manager.send_to_room(f"offer:{offer_id}", message)
    
    async def notify_payment_received(self, payment_id: int, amount: float, partner_id: int):
        """Notify when a payment is received."""
        message = {
            "type": "payment_received",
            "payment_id": payment_id,
            "amount": amount,
            "partner_id": partner_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.manager.send_personal_message(partner_id, message)
        await self.manager.send_to_room("admins", message)
        await self.manager.send_to_room(f"partner:{partner_id}", message)
    
    async def notify_invoice_created(self, invoice_id: int, partner_id: int):
        """Notify when an invoice is created."""
        message = {
            "type": "invoice_created",
            "invoice_id": invoice_id,
            "partner_id": partner_id,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.manager.send_personal_message(partner_id, message)
        await self.manager.send_to_room("admins", message)
        await self.manager.send_to_room(f"partner:{partner_id}", message)
    
    async def notify_property_updated(self, property_id: int, changes: Dict):
        """Notify when a property is updated."""
        message = {
            "type": "property_updated",
            "property_id": property_id,
            "changes": changes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.manager.send_to_room("admins", message)
        await self.manager.send_to_room(f"property:{property_id}", message)
        
        # Invalidate cache
        cache.delete(f"property:{property_id}")
        cache.clear_pattern("properties:list:*")
    
    async def notify_suite_updated(self, suite_id: int, changes: Dict):
        """Notify when a suite is updated."""
        message = {
            "type": "suite_updated",
            "suite_id": suite_id,
            "changes": changes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.manager.send_to_room("admins", message)
        await self.manager.send_to_room(f"suite:{suite_id}", message)
        
        # Invalidate cache
        cache.delete(f"suite:{suite_id}")
        cache.clear_pattern("properties:list:*")
    
    async def send_system_notification(self, title: str, message: str, target_users: List[int] = None):
        """Send a system notification."""
        notification = {
            "type": "system_notification",
            "title": title,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if target_users:
            for user_id in target_users:
                await self.manager.send_personal_message(user_id, notification)
        else:
            await self.manager.broadcast_to_all(notification)


# Global real-time event service
realtime_service = RealtimeEventService(manager)


async def get_current_user_websocket(websocket: WebSocket, token: str, db: Session) -> User:
    """Authenticate WebSocket connection and get current user."""
    try:
        payload = decode_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")


async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """Main WebSocket endpoint."""
    try:
        # Authenticate user
        user = await get_current_user_websocket(websocket, token, db)
        
        # Connect user
        await manager.connect(websocket, user.id, {
            "username": user.username,
            "role": user.role,
            "partner_id": user.partner_id
        })
        
        # Subscribe to role-based rooms
        if user.role == "admin":
            manager.subscribe_to_room(user.id, "admins")
        if user.partner_id:
            manager.subscribe_to_room(user.id, f"partner:{user.partner_id}")
        
        try:
            while True:
                # Receive message
                data = await websocket.receive_text()
                message_data = json.loads(data)
                message = WebSocketMessage(**message_data)
                
                # Handle different message types
                if message.type == "subscribe_room":
                    manager.subscribe_to_room(user.id, message.room)
                    await manager.send_personal_message(user.id, {
                        "type": "subscribed",
                        "room": message.room,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                elif message.type == "unsubscribe_room":
                    manager.unsubscribe_from_room(user.id, message.room)
                    await manager.send_personal_message(user.id, {
                        "type": "unsubscribed",
                        "room": message.room,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                elif message.type == "ping":
                    await manager.send_personal_message(user.id, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                elif message.type == "get_status":
                    await manager.send_personal_message(user.id, {
                        "type": "status",
                        "connected_users": manager.get_connected_users(),
                        "connection_count": manager.get_connection_count(),
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                else:
                    await manager.send_personal_message(user.id, {
                        "type": "error",
                        "message": f"Unknown message type: {message.type}",
                        "timestamp": datetime.utcnow().isoformat()
                    })
        
        except WebSocketDisconnect:
            manager.disconnect(websocket)
    
    except HTTPException as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    except Exception as e:
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)


def get_connection_manager() -> ConnectionManager:
    """Dependency to get connection manager."""
    return manager


def get_realtime_service() -> RealtimeEventService:
    """Dependency to get real-time event service."""
    return realtime_service
