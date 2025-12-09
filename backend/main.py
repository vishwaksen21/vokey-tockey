"""
Vokey-Tockey Backend Server
FastAPI + WebSocket for real-time voice chat signaling
"""

import uuid
import re
from typing import Dict, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Vokey-Tockey API",
    description="Real-time voice chat signaling server",
    version="1.0.0"
)

# CORS configuration - allows frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
MAX_USERS_PER_ROOM = 20
ROOM_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]+$')

# --- Data Structures ---
# rooms: Maps roomId -> set of WebSocket connections
rooms: Dict[str, Set[WebSocket]] = {}

# client_info: Maps WebSocket -> dict with clientId and roomId
client_info: Dict[WebSocket, dict] = {}

# client_ids: Maps roomId -> dict of clientId -> WebSocket
client_ids: Dict[str, Dict[str, WebSocket]] = {}


# --- Helper Functions ---

def validate_room_id(room_id: str) -> bool:
    """Validate room ID format (alphanumeric + - and _ only)"""
    return bool(ROOM_ID_PATTERN.match(room_id)) and len(room_id) <= 50


async def broadcast_to_room(room_id: str, message: dict, exclude: WebSocket = None):
    """
    Broadcast a message to all clients in a room
    
    Args:
        room_id: The room to broadcast to
        message: The message dict to send (will be JSON encoded)
        exclude: Optional WebSocket to exclude from broadcast
    """
    if room_id not in rooms:
        return
    
    dead_connections = set()
    
    for client in rooms[room_id]:
        if client == exclude:
            continue
        
        try:
            await client.send_json(message)
        except Exception as e:
            logger.error(f"Error broadcasting to client: {e}")
            dead_connections.add(client)
    
    # Clean up dead connections
    for dead_client in dead_connections:
        await cleanup_client(dead_client)


async def send_to_client(room_id: str, client_id: str, message: dict):
    """
    Send a message to a specific client by their ID
    
    Args:
        room_id: The room the client is in
        client_id: The target client's ID
        message: The message dict to send
    """
    if room_id not in client_ids or client_id not in client_ids[room_id]:
        logger.warning(f"Client {client_id} not found in room {room_id}")
        return
    
    client = client_ids[room_id][client_id]
    
    try:
        await client.send_json(message)
    except Exception as e:
        logger.error(f"Error sending to client {client_id}: {e}")
        await cleanup_client(client)


async def cleanup_client(websocket: WebSocket):
    """
    Remove a client from all data structures and notify room
    
    Args:
        websocket: The WebSocket connection to clean up
    """
    if websocket not in client_info:
        return
    
    info = client_info[websocket]
    room_id = info['roomId']
    client_id = info['clientId']
    
    # Remove from rooms
    if room_id in rooms:
        rooms[room_id].discard(websocket)
        
        # If room is empty, delete it
        if len(rooms[room_id]) == 0:
            del rooms[room_id]
            if room_id in client_ids:
                del client_ids[room_id]
            logger.info(f"Room {room_id} deleted (empty)")
    
    # Remove from client_ids
    if room_id in client_ids and client_id in client_ids[room_id]:
        del client_ids[room_id][client_id]
    
    # Remove from client_info
    del client_info[websocket]
    
    # Notify other clients that this peer left
    await broadcast_to_room(room_id, {
        "type": "peer-left",
        "clientId": client_id
    })
    
    logger.info(f"Client {client_id} removed from room {room_id}")


# --- HTTP Endpoints ---

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Vokey-Tockey API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "room_info": "/rooms/{roomId}/info",
            "websocket": "/ws/rooms/{roomId}"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_rooms": len(rooms),
        "total_clients": len(client_info)
    }


@app.get("/rooms/{room_id}/info")
async def get_room_info(room_id: str):
    """
    Get information about a specific room
    
    Args:
        room_id: The room ID to get info for
    
    Returns:
        Room information including participant count
    """
    if not validate_room_id(room_id):
        raise HTTPException(status_code=400, detail="Invalid room ID format")
    
    if room_id not in rooms:
        return {
            "roomId": room_id,
            "exists": False,
            "participantCount": 0,
            "participants": []
        }
    
    participants = []
    if room_id in client_ids:
        participants = list(client_ids[room_id].keys())
    
    return {
        "roomId": room_id,
        "exists": True,
        "participantCount": len(rooms[room_id]),
        "participants": participants
    }


# --- WebSocket Endpoint ---

@app.websocket("/ws/rooms/{room_id}")
async def websocket_room_endpoint(websocket: WebSocket, room_id: str):
    """
    WebSocket endpoint for room connections
    Handles signaling for WebRTC connections
    
    Args:
        websocket: The WebSocket connection
        room_id: The room ID to join
    """
    
    # Validate room ID
    if not validate_room_id(room_id):
        await websocket.close(code=1008, reason="Invalid room ID format")
        return
    
    # Check room capacity
    if room_id in rooms and len(rooms[room_id]) >= MAX_USERS_PER_ROOM:
        await websocket.close(code=1008, reason="Room is full")
        return
    
    # Accept the connection
    await websocket.accept()
    
    # Generate unique client ID
    client_id = str(uuid.uuid4())
    
    # Initialize room if it doesn't exist
    if room_id not in rooms:
        rooms[room_id] = set()
        client_ids[room_id] = {}
        logger.info(f"Room {room_id} created")
    
    # Add client to room
    rooms[room_id].add(websocket)
    client_ids[room_id][client_id] = websocket
    client_info[websocket] = {
        "clientId": client_id,
        "roomId": room_id
    }
    
    logger.info(f"Client {client_id} joined room {room_id} ({len(rooms[room_id])} participants)")
    
    # Get list of existing clients (before this one joined)
    existing_clients = [cid for cid in client_ids[room_id].keys() if cid != client_id]
    
    try:
        # Send join confirmation to the new client
        await websocket.send_json({
            "type": "join",
            "clientId": client_id,
            "roomId": room_id,
            "existingClients": existing_clients
        })
        
        # Notify existing clients about new peer
        await broadcast_to_room(room_id, {
            "type": "new-peer",
            "clientId": client_id
        }, exclude=websocket)
        
        # Message handling loop
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            # Handle different message types
            if msg_type in ["offer", "answer", "ice-candidate"]:
                # Relay signaling messages to specific peer
                to_client_id = message.get("to")
                
                if not to_client_id:
                    logger.warning(f"Message from {client_id} missing 'to' field")
                    continue
                
                # Add 'from' field
                message["from"] = client_id
                
                # Send to target client
                await send_to_client(room_id, to_client_id, message)
                
                logger.debug(f"Relayed {msg_type} from {client_id} to {to_client_id}")
            
            else:
                logger.warning(f"Unknown message type: {msg_type}")
    
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected from room {room_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for client {client_id}: {e}")
    finally:
        # Clean up client connection
        await cleanup_client(websocket)


# --- Application Startup/Shutdown ---

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Vokey-Tockey server starting...")
    logger.info(f"Max users per room: {MAX_USERS_PER_ROOM}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Vokey-Tockey server shutting down...")
    # Close all WebSocket connections gracefully
    for room_id in list(rooms.keys()):
        for client in list(rooms[room_id]):
            try:
                await client.close()
            except:
                pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
