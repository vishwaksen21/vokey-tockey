# Audio Debugging Guide

## Recent Fixes Applied

### 1. **Timing Fix** (Most Important)
- **Problem**: Peer connections were created before microphone was ready
- **Solution**: Modified `useWebRTC.js` to wait for `localStream` before creating connections
- **Verification**: Look for "Waiting for microphone before creating peer connections..." in console

### 2. **Enhanced Logging**
Added detailed console messages to track audio flow:

#### When Microphone Initializes:
```
🎤 Microphone initialized with [N] audio tracks
```

#### When Peer Connection Created:
```
✅ Added local audio track to peer connection for [peerId]
```

#### When Remote Track Received:
```
✅ Received remote audio track from [peerId]
Remote stream: MediaStream {...}
```

#### When Audio Element Created:
```
📢 Setting up audio for [clientId]:
  hasAudioTracks: 1
  audioTrackEnabled: true
  audioTrackReadyState: "live"
✅ Audio playing for [clientId]
```

## Testing Steps

### Step 1: Open Two Browser Windows
1. Open your Vercel site in two different browsers (or incognito + normal)
2. Or use two different devices (phone + computer)

### Step 2: Join Same Room
1. In both windows, enter the same room ID (e.g., "test123")
2. Click "Join Room"

### Step 3: Enable Microphones
1. Allow microphone access in both browsers
2. Click the microphone button to unmute
3. Both should show green "Connected" status

### Step 4: Check Console Logs
Open browser DevTools (F12) and look for these messages **in order**:

#### User 1 (First to join):
```
Connected to WebSocket
🎤 Microphone initialized with 1 audio tracks
Client ID: [uuid]
Participants in room: 1
```

#### User 2 (Joins second):
```
Connected to WebSocket
🎤 Microphone initialized with 1 audio tracks
Client ID: [uuid]
Participants in room: 2
✅ Added local audio track to peer connection for [User1's-ID]
```

#### User 1 (Receives User 2):
```
Participants in room: 2
✅ Added local audio track to peer connection for [User2's-ID]
✅ Received remote audio track from [User2's-ID]
Remote stream: MediaStream {id: "...", active: true}
📢 Setting up audio for [User2's-ID]:
  hasAudioTracks: 1
  audioTrackEnabled: true
  audioTrackReadyState: "live"
✅ Audio playing for [User2's-ID]
```

## What to Look For

### ✅ Success Indicators:
- "hasAudioTracks: 1" (means remote stream has audio)
- "audioTrackEnabled: true" (track is not muted)
- "audioTrackReadyState: live" (track is active)
- "✅ Audio playing for [id]" (playback started)

### ❌ Problem Indicators:

#### If you see:
```
Waiting for microphone before creating peer connections...
```
**Means**: Microphone not ready yet - this is normal, should resolve in 1-2 seconds

#### If you see:
```
hasAudioTracks: 0
```
**Problem**: Remote peer didn't add their audio track
**Solution**: Check if remote peer's microphone is unmuted

#### If you see:
```
audioTrackEnabled: false
```
**Problem**: Remote peer's audio track is muted
**Solution**: Remote peer needs to click microphone button

#### If you see:
```
❌ Error playing audio for [id]: NotAllowedError
```
**Problem**: Browser blocked autoplay
**Solution**: Click anywhere on the page to allow audio, then refresh

#### If you DON'T see "✅ Received remote audio track":
**Problem**: WebRTC connection failed
**Check**: 
1. Both users are in same room ID
2. Both have internet connection
3. No firewall blocking WebRTC
4. Backend WebSocket is connected

## Network Requirements

### Ports:
- WebSocket: 443 (HTTPS/WSS)
- STUN: 19302 (UDP)

### Firewall:
- Allow WebRTC traffic (UDP ports 10000-65535)
- If behind strict firewall, you may need TURN server

## Common Issues

### Issue 1: "Can't hear anyone"
**Checklist**:
- [ ] Both users have microphone unmuted (green status)
- [ ] Console shows "✅ Audio playing for [id]"
- [ ] Volume is turned up
- [ ] Try speaking - check if speaking indicator animates

### Issue 2: "Other person can't hear me"
**Checklist**:
- [ ] Your microphone is unmuted
- [ ] Console shows "✅ Added local audio track to peer connection"
- [ ] Browser has microphone permission
- [ ] Microphone is working in other apps

### Issue 3: "Connection keeps dropping"
**Checklist**:
- [ ] Stable internet connection
- [ ] Not behind corporate firewall
- [ ] Try different browser
- [ ] Check backend is running: https://vokey-tockey-backend.onrender.com/health

## Next Steps

1. **After Vercel redeploys** (1-2 minutes from last git push):
   - Clear browser cache (Ctrl+Shift+Delete)
   - Hard refresh (Ctrl+Shift+R)
   - Test with two browsers

2. **Send me the console output**:
   - Copy all console messages from both browsers
   - Tell me what you see/hear
   - Let me know which messages are missing

3. **If still not working**:
   - I'll add TURN server for better NAT traversal
   - Or add fallback relay server
   - Or investigate browser-specific issues

## Browser Compatibility

### Tested & Should Work:
- ✅ Chrome/Edge (best support)
- ✅ Firefox
- ✅ Safari (iOS 11+)
- ✅ Mobile browsers

### Known Issues:
- Safari may require user interaction before playing audio
- Some browsers block autoplay - click page if audio doesn't start

---

**Last Updated**: After fixing microphone timing issue and adding comprehensive logging
