# 🎙️ Vokey-Tockey

**Anonymous, Real-Time, Multi-User Voice Chat Web App**

A WebRTC-based voice chat application that allows users to create and join voice rooms instantly without any authentication.

---

## 🏗️ System Architecture

```
┌─────────────────┐         WebSocket (WSS)          ┌──────────────────┐
│                 │◄──────── Signaling ──────────────►│                  │
│  React Frontend │         (offer/answer/ICE)        │  FastAPI Backend │
│   + Tailwind    │                                   │   + WebSockets   │
│                 │                                   │                  │
└────────┬────────┘                                   └──────────────────┘
         │                                                     │
         │ WebRTC (Peer-to-Peer Audio)                        │
         │                                                     │
         └──────────────────┐                                 │
                            │                                 │
                    ┌───────▼────────┐                        │
                    │  Other Peers   │◄───────────────────────┘
                    │  (RTCPeerConn) │    Manages room state
                    └────────────────┘    & client connections
```

### How It Works

1. **Landing Page**: User enters or generates a random room ID
2. **WebSocket Connection**: Browser connects to FastAPI via WebSocket (`/ws/rooms/{roomId}`)
3. **Room Join**: Server assigns unique `clientId` and notifies existing peers
4. **WebRTC Signaling**: Peers exchange SDP offers/answers and ICE candidates through WebSocket
5. **P2P Audio**: WebRTC establishes direct peer-to-peer audio connections
6. **Real-Time Communication**: Users can talk, mute/unmute, and see who's speaking

---

## 📁 Project Structure

```
vokey-tockey/
├── backend/                    # Python FastAPI server
│   ├── main.py                # Main FastAPI app with WebSocket endpoints
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
│
├── frontend/                   # React + Tailwind app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── MicButton.jsx
│   │   │   ├── ParticipantCard.jsx
│   │   │   └── SpeakingIndicator.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useWebRTC.js
│   │   │   └── useRoomWebSocket.js
│   │   ├── pages/             # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   └── RoomPage.jsx
│   │   ├── utils/             # Helper functions
│   │   │   └── roomIdGenerator.js
│   │   ├── App.jsx            # Root component with routing
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── README.md                   # This file
└── DEPLOYMENT.md              # Deployment guide
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- Modern browser with WebRTC support

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_BACKEND_WS_URL=ws://localhost:8000" > .env.local

# Run development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Test It Out

1. Open `http://localhost:5173` in two different browser windows (or use incognito mode)
2. Click "Create Random Room" in the first window
3. Copy the room ID from the URL
4. In the second window, paste the room ID and click "Join Room"
5. Allow microphone access in both windows
6. You should now be able to talk between the two windows!

---

## 🎯 Core Features

✅ **Anonymous Rooms** - No login required, just join with a room ID  
✅ **Real-Time Voice** - WebRTC peer-to-peer audio communication  
✅ **WebSocket Signaling** - FastAPI WebSocket for connection negotiation  
✅ **Room Management** - Server tracks active rooms and participants  
✅ **Mute/Unmute** - Toggle microphone on/off  
✅ **Speaking Indicators** - Visual feedback when users are speaking  
✅ **Connection Status** - See who's connected and connection state  
✅ **Responsive UI** - Clean, modern interface with Tailwind CSS  
✅ **Error Handling** - Graceful handling of permissions, disconnections, etc.  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS 3, Vite |
| **Backend** | Python 3.9+, FastAPI, Uvicorn |
| **Real-Time** | WebSockets (signaling), WebRTC (audio) |
| **Routing** | React Router 6 |
| **State** | React Hooks (useState, useEffect, useRef) |

---

## 🔒 Safety & Limits

- **Max Users Per Room**: 20 (configurable in backend)
- **Room ID Validation**: Alphanumeric + hyphens/underscores only
- **Auto-Cleanup**: Dead connections removed automatically
- **STUN Server**: Google's public STUN server for NAT traversal
- **CORS**: Configured for cross-origin requests

---

## 📚 API Reference

### WebSocket Endpoint

**Endpoint**: `ws://localhost:8000/ws/rooms/{roomId}`

**Message Types**:

```json
// Join notification
{
  "type": "join",
  "clientId": "uuid-here",
  "roomId": "room-123"
}

// New peer joined
{
  "type": "new-peer",
  "clientId": "uuid-here"
}

// WebRTC Offer
{
  "type": "offer",
  "from": "sender-id",
  "to": "receiver-id",
  "payload": { "sdp": "...", "type": "offer" }
}

// WebRTC Answer
{
  "type": "answer",
  "from": "sender-id",
  "to": "receiver-id",
  "payload": { "sdp": "...", "type": "answer" }
}

// ICE Candidate
{
  "type": "ice-candidate",
  "from": "sender-id",
  "to": "receiver-id",
  "payload": { "candidate": "...", "sdpMid": "...", "sdpMLineIndex": 0 }
}

// Peer left
{
  "type": "peer-left",
  "clientId": "uuid-here"
}
```

### HTTP Endpoints

- `GET /health` - Health check
- `GET /rooms/{roomId}/info` - Get room information (participant count)

---

## 🐛 Troubleshooting

**Microphone not working?**
- Ensure you've granted microphone permissions
- Check browser console for errors
- Verify HTTPS/WSS in production (required for WebRTC)

**Can't connect to room?**
- Check that backend is running
- Verify WebSocket URL in `.env.local`
- Check browser console for WebSocket connection errors

**No audio from other users?**
- Check that they've unmuted their microphone
- Verify WebRTC connection status in browser DevTools
- Ensure both users are in the same room

**STUN/TURN issues?**
- Default config uses Google's public STUN server
- For production, consider using a TURN server for better connectivity

---

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

All browsers must support WebRTC and getUserMedia API.

---

## 📄 License

MIT License - feel free to use this project however you'd like!

---

## 🤝 Contributing

This is a learning project, but contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 🎓 Learning Resources

- [WebRTC Documentation](https://webrtc.org/)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

---

Built by C Vishwak Sena