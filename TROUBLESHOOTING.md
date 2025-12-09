# 🔧 Troubleshooting Guide - Vokey-Tockey

Common issues and solutions for Vokey-Tockey development and deployment.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Issues](#development-issues)
- [WebRTC Issues](#webrtc-issues)
- [WebSocket Issues](#websocket-issues)
- [Audio Issues](#audio-issues)
- [Deployment Issues](#deployment-issues)
- [Browser Issues](#browser-issues)

---

## Installation Issues

### Python Dependencies Won't Install

**Problem:** `pip install -r requirements.txt` fails

**Solutions:**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Try installing one by one
pip install fastapi uvicorn websockets

# Check Python version (need 3.9+)
python --version
```

### Node Modules Won't Install

**Problem:** `npm install` fails

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

---

## Development Issues

### Backend Won't Start

**Problem:** `uvicorn main:app --reload` fails

**Check:**
```bash
# 1. Is port 8000 already in use?
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process if needed
kill -9 <PID>  # Mac/Linux

# 2. Is virtual environment activated?
which python  # Should show venv path

# 3. Check for syntax errors
python backend/main.py
```

### Frontend Won't Start

**Problem:** `npm run dev` fails

**Check:**
```bash
# 1. Is port 5173 in use?
lsof -i :5173  # Mac/Linux

# 2. Node version (need 18+)
node --version

# 3. Try different port
npm run dev -- --port 3000
```

### Environment Variables Not Loading

**Problem:** Backend can't connect or CORS errors

**Solution:**
```bash
# Backend - create .env file
cd backend
cp .env.example .env

# Frontend - create .env.local
cd frontend
echo "VITE_BACKEND_WS_URL=ws://localhost:8000" > .env.local

# Restart both servers after creating env files
```

---

## WebRTC Issues

### Can't Hear Other Users

**Diagnosis:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for WebRTC errors

**Common Causes:**

**1. RTCPeerConnection not established**
```
Solution: Check browser console for ICE errors
- Verify STUN server is accessible
- Check if WebSocket connection is stable
```

**2. Remote stream not received**
```javascript
// In browser console, check:
document.querySelectorAll('audio').length  // Should see audio elements

// Check if streams exist:
// Open Components tab in React DevTools
// Check RoomPage -> peers state
```

**3. Audio element not playing**
```
Solution: Click anywhere on page first (browser autoplay policy)
Check browser console for: "play() request was interrupted"
```

### WebRTC Connection Fails

**Problem:** Peers can't connect

**Debug Steps:**
```javascript
// 1. Check ICE connection state (browser console)
// In useWebRTC.js, connection state logs should show:
// "new" -> "checking" -> "connected"

// 2. If stuck at "checking":
// - STUN server might be blocked
// - Firewall blocking UDP
// - Need TURN server

// 3. Test STUN server
fetch('https://networktest.twilio.com/v1/connection-test')
  .then(r => r.json())
  .then(console.log)
```

**Solutions:**
```javascript
// Try different STUN servers
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' },
  ]
};

// Add TURN server for restrictive networks
{
  urls: 'turn:openrelay.metered.ca:80',
  username: 'openrelayproject',
  credential: 'openrelayproject'
}
```

### ICE Candidates Not Exchanging

**Problem:** No ICE candidates being sent/received

**Check:**
```javascript
// Enable detailed logging in useWebRTC.js
pc.onicecandidate = (event) => {
  console.log('ICE Candidate:', event.candidate);
  if (event.candidate) {
    console.log('Candidate type:', event.candidate.type);
    console.log('Candidate:', event.candidate.candidate);
    // ... send to peer
  }
};
```

**Common Issues:**
- WebSocket disconnected before ICE gathering completes
- Remote peer not handling ice-candidate messages
- Pending candidates not added after remote description set

---

## WebSocket Issues

### WebSocket Won't Connect

**Problem:** "WebSocket connection failed"

**Check Backend:**
```bash
# Is backend running?
curl http://localhost:8000/health

# Check WebSocket endpoint
wscat -c ws://localhost:8000/ws/rooms/test
# Install wscat: npm install -g wscat
```

**Check Frontend:**
```javascript
// Verify WebSocket URL in browser console
console.log(import.meta.env.VITE_BACKEND_WS_URL)

// Should be:
// - Development: ws://localhost:8000
// - Production: wss://your-domain.com
```

**Common Causes:**
1. Wrong URL in `.env.local`
2. CORS blocking connection
3. Backend not running
4. Port mismatch

### WebSocket Keeps Disconnecting

**Problem:** Connection drops frequently

**Solutions:**

**1. Add heartbeat/ping-pong**
```python
# In backend main.py
@app.websocket("/ws/rooms/{room_id}")
async def websocket_room_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    
    # Send ping every 30 seconds
    async def keep_alive():
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    
    asyncio.create_task(keep_alive())
    # ... rest of code
```

**2. Improve reconnection logic**
```javascript
// Already implemented in useRoomWebSocket.js
// Check MAX_RECONNECT_ATTEMPTS and backoff delay
```

### Messages Not Being Received

**Problem:** WebSocket connected but messages don't arrive

**Debug:**
```javascript
// Add logging in useRoomWebSocket.js
ws.onmessage = (event) => {
  console.log('RAW MESSAGE:', event.data);
  const message = JSON.parse(event.data);
  console.log('PARSED MESSAGE:', message);
  // ...
};

// Check if handler is registered
console.log('Message handlers:', messageHandlersRef.current);
```

---

## Audio Issues

### No Microphone Permission

**Problem:** Browser doesn't ask for microphone

**Solutions:**
```
1. Ensure site is HTTPS (required for mic access)
   - Localhost is exempt from this rule
   
2. Reset permissions:
   - Chrome: Site settings -> Reset permissions
   - Firefox: Page info -> Permissions -> Microphone
   
3. Check browser privacy settings
   
4. Try different browser
```

### Microphone Denied

**Problem:** User denied permission

**Solution:**
```javascript
// Already handled in useWebRTC.js
// Show clear error message
// User must manually allow in browser settings
```

**Instructions for Users:**
```
Chrome:
1. Click lock icon in address bar
2. Click "Site settings"
3. Set Microphone to "Allow"
4. Refresh page

Firefox:
1. Click lock icon
2. Click "Connection secure"
3. More information -> Permissions
4. Uncheck "Block" for Microphone
5. Refresh page
```

### Microphone Not Working

**Problem:** Permission granted but no audio

**Debug:**
```javascript
// In browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('Stream tracks:', stream.getTracks());
    console.log('Track enabled:', stream.getAudioTracks()[0].enabled);
    
    // Test if mic is actually capturing audio
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a,b) => a+b) / dataArray.length;
      console.log('Audio level:', average);
    }, 1000);
  })
  .catch(console.error);
```

### Echo or Feedback

**Problem:** Hearing own voice or feedback loop

**Causes:**
- Two devices in same room both on speaker
- Browser tab duplicated on same device
- Audio routing issue

**Solutions:**
1. Use headphones
2. Close duplicate tabs
3. Ensure local stream not connected to audio element
4. Check that `isLocal` prop is set correctly in ParticipantCard

---

## Deployment Issues

### Production WebSocket Not Working

**Problem:** Works locally, fails in production

**Common Issues:**

**1. Using ws:// instead of wss://**
```bash
# .env.production
VITE_BACKEND_WS_URL=wss://api.yourdomain.com  # NOT ws://
```

**2. CORS not configured for production domain**
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ],  # Must include your actual domains
    # ...
)
```

**3. WebSocket not supported by hosting platform**
```
Check provider documentation:
- Render: Supported ✓
- Railway: Supported ✓
- Heroku: Need to use proper dyno type
- Vercel: Functions don't support WebSockets ✗
```

### HTTPS/SSL Issues

**Problem:** WebRTC requires HTTPS in production

**Solution:**
```
1. Frontend MUST be HTTPS
2. Backend MUST be HTTPS (for WSS)
3. Use Let's Encrypt for free SSL
4. Most hosting platforms provide SSL automatically
```

### CORS Errors in Production

**Problem:** "CORS policy: No 'Access-Control-Allow-Origin'"

**Fix:**
```python
# Ensure backend allows frontend origin
# backend/main.py - line 29
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",  # Add your domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Browser Issues

### Safari-Specific Issues

**Problem:** Works in Chrome, not Safari

**Known Issues:**
```
1. Safari needs user interaction before playing audio
   Solution: Show "Click to start" button

2. Safari WebRTC has stricter requirements
   Solution: Ensure all codecs are supported

3. Safari autoplay policy is strict
   Solution: Add autoplay=true, playsInline=true to audio elements
```

### Mobile Browser Issues

**Problem:** Doesn't work on mobile

**Check:**
```
1. HTTPS is required on mobile (no localhost exception)
2. Some mobile browsers don't support WebRTC
3. Background audio may be restricted
4. Autoplay policies are stricter

Solutions:
- Use Chrome or Safari on mobile
- Ensure site is HTTPS
- Add user interaction before starting audio
```

### Firefox-Specific Issues

**Problem:** WebRTC works in Chrome but not Firefox

**Common Causes:**
```
1. Different ICE candidate format
   Solution: Ensure proper JSON serialization

2. Firefox stricter about SDP
   Solution: Log SDP and verify format

3. Audio permissions UI different
   Solution: Clear instructions for users
```

---

## General Debugging Tips

### Enable Detailed Logging

**Frontend:**
```javascript
// Add to useWebRTC.js and useRoomWebSocket.js
const DEBUG = true;

if (DEBUG) console.log('...detailed message...');
```

**Backend:**
```python
# Change logging level
logging.basicConfig(level=logging.DEBUG)
```

### Use Browser DevTools

**Inspect WebRTC:**
```
Chrome: chrome://webrtc-internals
Firefox: about:webrtc
```

**Network Tab:**
- Check WebSocket connection
- Verify messages being sent/received
- Check for failed requests

**Console Tab:**
- Look for error messages
- Check component state logs

### Test with Different Networks

```
1. Same WiFi (easiest)
2. Different WiFi networks
3. One on WiFi, one on cellular
4. Behind corporate firewall (hardest - may need TURN)
```

---

## Still Having Issues?

1. **Check logs** - Both frontend (browser console) and backend (terminal)
2. **Enable debug mode** - See detailed logging section above
3. **Test components individually** - Isolate the problem
4. **Check browser compatibility** - Use supported browsers
5. **Review documentation** - See README.md and other docs
6. **Create minimal reproduction** - Simplify to find the root cause

---

## Useful Debug Commands

```bash
# Check if port is in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Test backend health
curl http://localhost:8000/health

# Test WebSocket (install wscat first)
wscat -c ws://localhost:8000/ws/rooms/test-room

# Check Python packages
pip list

# Check Node packages
npm list

# Verify environment variables
env | grep VITE  # Frontend
env | grep ALLOWED_ORIGINS  # Backend
```

---

**Remember:** Most issues are related to:
1. Environment configuration
2. HTTPS/WSS in production
3. CORS settings
4. Firewall/network restrictions
5. Browser permissions

Start with these when debugging!
