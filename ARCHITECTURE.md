# Vokey-Tockey - Technical Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

  User 1                                                    User 2
    │                                                          │
    │  1. Opens app                                           │
    ▼                                                          │
┌─────────────┐                                               │
│ Landing Page│                                               │
│  - Enter ID │                                               │
│  - OR       │                                               │
│  - Create   │                                               │
└──────┬──────┘                                               │
       │ Clicks "Create Room"                                 │
       │ Generated: vokey-abc123                              │
       │                                                      │
       ▼                                                      │
┌──────────────┐                                              │
│  Room Page   │                                              │
│  /room/      │                                              │
│  vokey-abc123│◄─────────────────────────────────────────────┤
└──────┬───────┘          User 2 joins same room             │
       │                  by entering "vokey-abc123"          │
       │                                                      │
       ▼                                                      ▼
   Request Mic                                           Request Mic
   Permission                                            Permission
       │                                                      │
       ▼                                                      ▼
   Connect to                                            Connect to
   WebSocket                                             WebSocket
       │                                                      │
       └──────────────────┬──────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │   WebSocket Signaling Exchange      │
        │  (Offers, Answers, ICE Candidates)  │
        └─────────────────┬───────────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │  WebRTC Peer Connection      │
           │  Established (P2P Audio)     │
           └──────────────────────────────┘
                          │
                          ▼
                 🎙️ Voice Chat Active!


┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND (React)                    BACKEND (FastAPI)
═════════════════                   ══════════════════

┌─────────────────┐
│   LandingPage   │
│                 │
│  - Room input   │
│  - Create btn   │
│  - Join btn     │
└────────┬────────┘
         │ navigate()
         ▼
┌─────────────────────────────────┐
│         RoomPage                │         ┌──────────────────┐
│                                 │         │   FastAPI App    │
│  ┌───────────────────────────┐ │         │                  │
│  │  useRoomWebSocket()       │◄┼────WS───┤  /ws/rooms/:id   │
│  │  - Connect to WS          │ │         │                  │
│  │  - Send/receive signals   │ │         │  - Room state    │
│  │  - Handle reconnect       │ │         │  - Broadcast     │
│  └──────────┬────────────────┘ │         │  - Relay signals │
│             │                   │         └──────────────────┘
│             │                   │                 │
│  ┌──────────▼────────────────┐ │                 │
│  │  useWebRTC()              │ │         ┌───────▼──────────┐
│  │  - Create peer conns     │ │         │  Data Structures │
│  │  - Handle local stream   │ │         │                  │
│  │  - Handle remote streams │ │         │  rooms: {}       │
│  │  - Send offers/answers   │ │         │  client_info: {} │
│  │  - Exchange ICE          │ │         │  client_ids: {}  │
│  └──────────┬────────────────┘ │         └──────────────────┘
│             │                   │
│  ┌──────────▼────────────────┐ │
│  │   UI Components           │ │
│  │  - MicButton              │ │
│  │  - ParticipantCard        │ │
│  │  - SpeakingIndicator      │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGE FLOW (WebSocket)                          │
└─────────────────────────────────────────────────────────────────────┘

Client A                     Server                      Client B
   │                           │                            │
   │──── connect ─────────────►│                            │
   │                           │                            │
   │◄─── join msg ─────────────│                            │
   │  { type: "join",          │                            │
   │    clientId: "uuid-A" }   │                            │
   │                           │                            │
   │                           │◄───── connect ─────────────│
   │                           │                            │
   │◄─ new-peer ──────────────│───── new-peer ────────────►│
   │  { type: "new-peer",      │  { type: "new-peer",       │
   │    clientId: "uuid-B" }   │    clientId: "uuid-A" }    │
   │                           │                            │
   │──── offer ───────────────►│                            │
   │  { type: "offer",         │                            │
   │    to: "uuid-B",          │                            │
   │    payload: { sdp } }     │──── offer ────────────────►│
   │                           │                            │
   │                           │◄───── answer ──────────────│
   │◄─── answer ──────────────│                            │
   │                           │                            │
   │──── ICE ─────────────────►│──── ICE ──────────────────►│
   │                           │                            │
   │◄──── ICE ────────────────│◄──── ICE ──────────────────│
   │                           │                            │
   └─ WebRTC P2P Audio ────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                  WebRTC CONNECTION FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

Peer A (Caller)                              Peer B (Callee)
      │                                            │
      │ 1. Create RTCPeerConnection                │
      │    with STUN servers                       │
      ▼                                            │
 Add local audio track                            │
      │                                            │
      │ 2. Create Offer                            │
      ▼                                            │
 Set local description (offer)                     │
      │                                            │
      │─────── Send Offer (via WS) ──────────────►│
      │                                            │
      │                                  3. Create RTCPeerConnection
      │                                            │
      │                                  Add local audio track
      │                                            │
      │                                  Set remote description (offer)
      │                                            │
      │                                  4. Create Answer
      │                                            │
      │                                  Set local description (answer)
      │                                            │
      │◄────── Send Answer (via WS) ──────────────│
      │                                            │
 5. Set remote description (answer)                │
      │                                            │
      │◄──────── Exchange ICE Candidates ─────────►│
      │          (both directions)                 │
      │                                            │
      ▼                                            ▼
 ICE Connection: new → checking → connected
      │                                            │
      │                                            │
      ▼                                            ▼
 ontrack event fires ──────────────────────── ontrack event fires
 (receive remote stream)                    (receive remote stream)
      │                                            │
      │                                            │
      └──────── Direct Audio Stream ──────────────┘
              (Peer-to-Peer, no server)


┌─────────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                                │
└─────────────────────────────────────────────────────────────────────┘

RoomPage Component State:
├── signalingSocket (from useRoomWebSocket)
│   ├── socket: WebSocket
│   ├── clientId: string
│   ├── isConnected: boolean
│   ├── connectionStatus: string
│   ├── otherPeers: string[]
│   └── methods: sendMessage(), onMessage(), disconnect()
│
└── webRTC (from useWebRTC)
    ├── localStream: MediaStream
    ├── peers: { [peerId]: { connection, stream, isSpeaking } }
    ├── isMuted: boolean
    ├── micPermissionGranted: boolean
    └── methods: toggleMute(), initializeMicrophone()


Server State (Backend):
├── rooms: { [roomId]: Set<WebSocket> }
├── client_info: { WebSocket: { clientId, roomId } }
└── client_ids: { [roomId]: { [clientId]: WebSocket } }


┌─────────────────────────────────────────────────────────────────────┐
│                      DATA FLOW                                       │
└─────────────────────────────────────────────────────────────────────┘

Audio Capture:
getUserMedia() → MediaStream → RTCPeerConnection.addTrack()
                                         │
                                         ▼
                              Sent via WebRTC (P2P)
                                         │
                                         ▼
                   Peer's RTCPeerConnection.ontrack
                                         │
                                         ▼
                                  MediaStream
                                         │
                                         ▼
                                  Audio Element
                                         │
                                         ▼
                                   Speaker 🔊


Speaking Detection:
MediaStream → AudioContext → AnalyserNode → getByteFrequencyData()
                                                      │
                                                      ▼
                                          Calculate average volume
                                                      │
                                                      ▼
                                          Update visual indicator


Signaling:
WebSocket Message → useRoomWebSocket → messageHandlers → useWebRTC
                                                             │
                                                             ▼
                                                    RTCPeerConnection
                                                     (offer/answer/ICE)


┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

Connection Errors:
WebSocket.onerror → Update connectionStatus → Show error UI
                                                      │
                                                      ▼
                                          Attempt reconnection
                                          (exponential backoff)

Microphone Errors:
getUserMedia() error → Check error.name → Display specific message
                                                      │
                                                      ▼
                                          - NotAllowedError: Permission denied
                                          - NotFoundError: No mic found
                                          - Other: Generic error

WebRTC Errors:
RTCPeerConnection.oniceconnectionstatechange → Monitor state
                                                      │
                                                      ▼
                                          failed/disconnected
                                                      │
                                                      ▼
                                          Log error, retry connection


┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                   │
└─────────────────────────────────────────────────────────────────────┘

1. CORS Protection (Backend)
   ├── Allowed origins whitelist
   └── Credential validation

2. Input Validation
   ├── Room ID format validation (regex)
   └── Message type validation

3. Rate Limiting (Optional)
   └── Per-IP connection limits

4. Room Limits
   └── Max 20 users per room

5. Connection Cleanup
   ├── Auto-remove dead connections
   └── Graceful shutdown handling

6. HTTPS/WSS (Production)
   ├── Required for WebRTC
   └── Encrypted WebSocket


┌─────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATIONS                         │
└─────────────────────────────────────────────────────────────────────┘

Frontend:
├── React.memo() for components
├── useCallback() for event handlers
├── useRef() for mutable values (avoid re-renders)
├── Lazy loading with React.lazy()
└── Code splitting with Vite

Backend:
├── Async/await for non-blocking I/O
├── In-memory state (fast access)
├── Efficient WebSocket broadcasting
└── Connection pooling

WebRTC:
├── P2P audio (no server bandwidth)
├── Audio constraints (echo cancellation, noise suppression)
└── STUN servers for NAT traversal


┌─────────────────────────────────────────────────────────────────────┐
│                    SCALING CONSIDERATIONS                            │
└─────────────────────────────────────────────────────────────────────┘

Current: In-Memory State (Single Server)
├── Pros: Fast, simple
└── Cons: Lost on restart, no horizontal scaling

For Production Scale:
├── Redis for distributed state
├── Message queue (Redis Pub/Sub)
├── Load balancer with sticky sessions
└── Multiple backend instances

Room Size Limits:
├── Mesh topology: 6-10 users max (current)
├── SFU topology: 20-50 users (requires server)
└── MCU topology: 100+ users (complex server)
```

## Key Takeaways

1. **WebSocket** = Signaling only (not for audio)
2. **WebRTC** = Actual audio P2P connection
3. **Server** = Matchmaker/coordinator, not audio relay
4. **Security** = HTTPS required in production
5. **Scaling** = Mesh works for small rooms, need SFU for larger

---

**See Also:**
- [README.md](./README.md) - Project overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
