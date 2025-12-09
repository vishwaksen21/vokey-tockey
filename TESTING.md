# 🧪 Testing Guide - Vokey-Tockey

This guide covers testing strategies for Vokey-Tockey.

---

## 📋 Manual Testing Checklist

### Landing Page Tests

- [ ] Page loads without errors
- [ ] "Create Random Room" button works
- [ ] Generates unique room IDs (format: `vokey-XXXXXX`)
- [ ] Room ID input accepts valid IDs
- [ ] Room ID input rejects invalid characters
- [ ] "Join Room" button navigates to room page
- [ ] Empty room ID shows error
- [ ] Responsive design works on mobile

### Room Page Tests

#### Connection Tests
- [ ] WebSocket connects to backend
- [ ] Client receives unique ID
- [ ] Connection status displays correctly
- [ ] Disconnection is handled gracefully
- [ ] Reconnection works after disconnect

#### Microphone Tests
- [ ] Browser requests microphone permission
- [ ] Permission granted: microphone works
- [ ] Permission denied: shows error message
- [ ] "Try Again" button re-requests permission
- [ ] Mute/unmute toggles correctly
- [ ] Mute icon updates correctly
- [ ] Local audio is not played back (no echo)

#### Multi-User Tests
- [ ] Second user can join room
- [ ] Both users see each other in participant list
- [ ] Audio flows between users
- [ ] Speaking indicators work
- [ ] Third user can join
- [ ] Multiple users can talk simultaneously
- [ ] User leaving is detected
- [ ] Remaining users stay connected

#### UI/UX Tests
- [ ] Room ID displays correctly
- [ ] Copy room ID works
- [ ] Share button works (if supported by browser)
- [ ] Participant cards show correct info
- [ ] Speaking indicators pulse when talking
- [ ] Leave room button works
- [ ] Returns to landing page after leaving
- [ ] Responsive design on mobile/tablet

#### Error Handling Tests
- [ ] Invalid room ID redirects to landing
- [ ] WebSocket failure shows error
- [ ] Microphone failure shows error
- [ ] Connection lost shows status
- [ ] Browser without WebRTC support shows message

---

## 🔬 Testing Scenarios

### Scenario 1: Happy Path (2 Users)

1. **User A:**
   - Opens app
   - Clicks "Create Random Room"
   - Allows microphone access
   - Sees "Connected" status
   - Sees themselves in participant list

2. **User B:**
   - Opens app in different browser/window
   - Copies room ID from User A
   - Clicks "Join Room"
   - Allows microphone access
   - Sees both users in participant list

3. **Both Users:**
   - Can hear each other talking
   - See speaking indicators when other talks
   - Can mute/unmute successfully
   - Can leave room gracefully

### Scenario 2: Permission Denied

1. User opens room
2. Browser asks for microphone permission
3. User clicks "Block/Deny"
4. App shows error message
5. User clicks "Try Again"
6. User allows permission
7. Microphone works

### Scenario 3: Network Interruption

1. User A and User B are connected
2. User A loses internet connection
3. User B sees User A disconnect
4. User A reconnects to internet
5. User A rejoins room
6. Connection re-established

### Scenario 4: Maximum Capacity

1. Room has 19 users
2. User 20 joins successfully
3. User 21 tries to join
4. User 21 sees "Room is full" message

### Scenario 5: Invalid Room ID

1. User enters room ID: `invalid@room#123`
2. Clicks "Join Room"
3. Sees error: "Invalid room ID format"
4. Corrects to: `valid-room-123`
5. Successfully joins

---

## 🌐 Browser Compatibility Testing

Test on these browsers:

| Browser | Version | WebRTC | getUserMedia | WebSocket | Status |
|---------|---------|--------|--------------|-----------|--------|
| Chrome  | 90+     | ✅     | ✅           | ✅        | ✅     |
| Firefox | 88+     | ✅     | ✅           | ✅        | ✅     |
| Safari  | 15+     | ✅     | ✅           | ✅        | ✅     |
| Edge    | 90+     | ✅     | ✅           | ✅        | ✅     |

### Browser-Specific Tests

**Chrome:**
- Check `chrome://webrtc-internals` for connection details
- Verify no console errors

**Firefox:**
- Check `about:webrtc` for connection details
- Test with Enhanced Tracking Protection enabled

**Safari:**
- Test on macOS and iOS
- Verify microphone permissions in System Preferences

**Edge:**
- Should behave similar to Chrome (Chromium-based)

---

## 📱 Device Testing

### Desktop
- [ ] Windows 10/11
- [ ] macOS
- [ ] Linux (Ubuntu/Debian)

### Mobile
- [ ] iOS Safari (iPhone)
- [ ] iOS Chrome (iPhone)
- [ ] Android Chrome
- [ ] Android Firefox

### Tablet
- [ ] iPad Safari
- [ ] Android Tablet

---

## 🔍 Debugging Tools

### Browser DevTools

**Console Tab:**
- Check for JavaScript errors
- View WebSocket messages
- See WebRTC logs

**Network Tab:**
- Verify WebSocket connection (WS protocol)
- Check for failed requests

**Application Tab:**
- Check local storage (if used)
- Verify no CORS issues

### WebRTC Internals

**Chrome:** `chrome://webrtc-internals`
- View peer connections
- Check ICE candidates
- Monitor audio/video tracks
- See connection statistics

**Firefox:** `about:webrtc`
- Similar to Chrome internals
- View connection logs

### Backend Logs

Monitor FastAPI logs:
```bash
# Watch backend logs
cd backend
uvicorn main:app --reload --log-level debug
```

Look for:
- WebSocket connections/disconnections
- Signaling messages (offer/answer/ICE)
- Error messages

---

## 🧩 Component Testing

### WebSocket Hook (`useRoomWebSocket.js`)

**Test Cases:**
```javascript
// Mock test structure
describe('useRoomWebSocket', () => {
  test('connects to WebSocket on mount', () => {
    // Test connection
  });
  
  test('assigns unique client ID', () => {
    // Test client ID assignment
  });
  
  test('handles new peer joining', () => {
    // Test peer join event
  });
  
  test('handles peer leaving', () => {
    // Test peer leave event
  });
  
  test('reconnects on disconnect', () => {
    // Test reconnection logic
  });
});
```

### WebRTC Hook (`useWebRTC.js`)

**Test Cases:**
```javascript
describe('useWebRTC', () => {
  test('requests microphone access', () => {
    // Test getUserMedia call
  });
  
  test('creates peer connections', () => {
    // Test RTCPeerConnection creation
  });
  
  test('sends offer to new peer', () => {
    // Test offer creation and sending
  });
  
  test('handles incoming answer', () => {
    // Test answer handling
  });
  
  test('handles ICE candidates', () => {
    // Test ICE candidate exchange
  });
});
```

---

## ⚡ Performance Testing

### Metrics to Monitor

1. **Connection Time:**
   - Time to establish WebSocket connection
   - Time to establish WebRTC connection
   - Should be < 2 seconds

2. **Audio Latency:**
   - End-to-end audio delay
   - Should be < 500ms

3. **CPU Usage:**
   - Monitor browser CPU usage
   - Should be < 30% for 5 users

4. **Memory Usage:**
   - Monitor browser memory
   - Should not leak over time

### Load Testing

**Test with Multiple Users:**

1. Open 5 browser windows
2. All join same room
3. Monitor:
   - CPU usage
   - Memory usage
   - Audio quality
   - Connection stability

4. Repeat with 10, 15, 20 users

**Expected Results:**
- 2-5 users: Excellent quality
- 6-10 users: Good quality
- 11-20 users: Acceptable quality
- 20+ users: May need SFU server

---

## 🔒 Security Testing

### Tests to Perform

1. **Input Validation:**
   - [ ] Room ID injection attempts
   - [ ] XSS in room ID
   - [ ] SQL injection (if using database)

2. **WebSocket Security:**
   - [ ] WSS (secure WebSocket) in production
   - [ ] Rate limiting on connections
   - [ ] Invalid message format handling

3. **CORS:**
   - [ ] Only allowed origins can connect
   - [ ] CORS headers properly set

4. **Privacy:**
   - [ ] No data stored without consent
   - [ ] Audio not recorded server-side
   - [ ] No tracking/analytics without notice

---

## 📊 Test Automation Ideas

### Backend Tests (Python)

```python
# tests/test_websocket.py
import pytest
from fastapi.testclient import TestClient
from main import app

def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_invalid_room_id():
    client = TestClient(app)
    # Test with invalid characters
    # Should reject connection
```

### Frontend Tests (Jest + React Testing Library)

```javascript
// tests/LandingPage.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './LandingPage';

test('creates random room on button click', () => {
  render(<LandingPage />);
  const button = screen.getByText(/Create Random Room/i);
  fireEvent.click(button);
  // Assert navigation occurred
});

test('shows error for empty room ID', () => {
  render(<LandingPage />);
  const button = screen.getByText(/Join Room/i);
  fireEvent.click(button);
  expect(screen.getByText(/Please enter a room ID/i)).toBeInTheDocument();
});
```

### E2E Tests (Playwright/Cypress)

```javascript
// e2e/room.spec.js
describe('Room functionality', () => {
  it('allows two users to join and communicate', () => {
    // User 1 creates room
    cy.visit('/');
    cy.contains('Create Random Room').click();
    cy.url().should('include', '/room/');
    
    // Get room ID
    cy.url().then(url => {
      const roomId = url.split('/room/')[1];
      
      // User 2 joins in different window
      cy.visit('/');
      cy.get('input').type(roomId);
      cy.contains('Join Room').click();
      
      // Assert both users are connected
      cy.contains('2 participants');
    });
  });
});
```

---

## 🐛 Known Issues & Workarounds

### Issue: Echo/Feedback

**Cause:** Local audio being played back  
**Workaround:** Use headphones, or ensure local stream is not connected to audio element

### Issue: ICE Connection Failed

**Cause:** Firewall/NAT blocking P2P connection  
**Workaround:** Use TURN server for relay

### Issue: Safari Audio Not Working

**Cause:** Autoplay policy  
**Workaround:** Require user interaction before playing audio

---

## ✅ Test Coverage Goals

- [ ] 80%+ code coverage on backend
- [ ] 70%+ code coverage on frontend
- [ ] All critical paths tested
- [ ] All error scenarios tested
- [ ] Cross-browser compatibility verified

---

## 📝 Bug Report Template

When reporting bugs, include:

```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Device: [e.g., Desktop]

**Screenshots:**
If applicable

**Console Logs:**
Paste any error messages from browser console

**Additional Context:**
Any other relevant information
```

---

**Happy Testing! 🧪**

Thorough testing ensures a great user experience!
