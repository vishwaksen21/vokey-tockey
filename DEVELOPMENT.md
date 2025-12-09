# 🎯 Development Guide - Vokey-Tockey

This guide helps you set up and run Vokey-Tockey locally for development.

---

## 📋 Prerequisites

Make sure you have these installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **Git** ([Download](https://git-scm.com/))
- A modern browser (Chrome, Firefox, Edge, or Safari)

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/vokey-tockey.git
cd vokey-tockey
```

### 2️⃣ Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file (optional)
cp .env.example .env

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

**Test it:**
- Open `http://localhost:8000` in browser - you should see API info
- Open `http://localhost:8000/health` - you should see health status

### 3️⃣ Set Up Frontend

Open a **new terminal window** (keep backend running):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# The .env.local should contain:
# VITE_BACKEND_WS_URL=ws://localhost:8000

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4️⃣ Test the Application

1. Open `http://localhost:5173` in your browser
2. Click "Create Random Room"
3. Allow microphone access when prompted
4. Open another browser window (or incognito mode)
5. Copy the room ID from the first window
6. In the second window, paste the room ID and click "Join Room"
7. You should now be able to talk between both windows!

---

## 🏗️ Project Structure

```
vokey-tockey/
├── backend/                   # FastAPI backend
│   ├── main.py               # Main application file
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── .gitignore
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── MicButton.jsx
│   │   │   ├── ParticipantCard.jsx
│   │   │   └── SpeakingIndicator.jsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useWebRTC.js
│   │   │   └── useRoomWebSocket.js
│   │   ├── pages/            # Page components
│   │   │   ├── LandingPage.jsx
│   │   │   └── RoomPage.jsx
│   │   ├── utils/            # Helper functions
│   │   │   └── roomIdGenerator.js
│   │   ├── App.jsx           # Root component
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
│
├── README.md                  # Main documentation
├── DEPLOYMENT.md             # Deployment guide
└── DEVELOPMENT.md            # This file
```

---

## 🔧 Development Tips

### Backend Development

**Hot Reload:**
The `--reload` flag automatically restarts the server when you change Python files.

**View API Documentation:**
FastAPI auto-generates interactive API docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

**Test WebSocket Manually:**
Use a WebSocket testing tool like [WebSocket King](https://websocketking.com/):
- URL: `ws://localhost:8000/ws/rooms/test-room`

**View Logs:**
The server logs all WebSocket connections and messages to the console.

**Debugging:**
Add print statements or use Python debugger:
```python
import pdb; pdb.set_trace()
```

### Frontend Development

**Hot Reload:**
Vite provides instant hot module replacement (HMR) - changes appear immediately.

**React DevTools:**
Install the [React Developer Tools](https://react.dev/learn/react-developer-tools) browser extension.

**View WebRTC Stats:**
Open browser DevTools → Console:
```javascript
// Get all peer connections
window.peerConnections = {}; // You can expose this from useWebRTC
```

**Debugging WebRTC:**
- Chrome: `chrome://webrtc-internals`
- Firefox: `about:webrtc`

**Tailwind CSS IntelliSense:**
Install the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) extension for VS Code.

---

## 🧪 Testing

### Testing with Multiple Users Locally

**Option 1: Multiple Browser Windows**
1. Open main browser window
2. Open incognito/private window
3. Both join the same room

**Option 2: Multiple Browsers**
1. Open in Chrome
2. Open in Firefox
3. Both join the same room

**Option 3: Multiple Devices (same network)**
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. On device 1: Go to `http://YOUR_IP:5173`
3. On device 2: Go to `http://YOUR_IP:5173`
4. Join the same room

### Testing Microphone

**Test Microphone Access:**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Mic access granted', stream))
  .catch(err => console.error('Mic access denied', err));
```

**Test Audio Output:**
Make sure your system audio is on and not muted!

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found" in Python

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Command not found: npm" or "Command not found: node"

**Solution:**
Install Node.js from [nodejs.org](https://nodejs.org/)

### Issue: Frontend can't connect to backend

**Solution:**
1. Verify backend is running on port 8000
2. Check `.env.local` has correct WebSocket URL
3. Check browser console for errors
4. Try `ws://127.0.0.1:8000` instead of `localhost`

### Issue: Microphone permission denied

**Solution:**
1. Chrome: Click the camera icon in address bar → Allow
2. Firefox: Click the microphone icon in address bar → Allow
3. Safari: Safari menu → Settings → Websites → Microphone
4. Edge: Settings → Cookies and site permissions → Microphone

### Issue: No audio from other users

**Solution:**
1. Check browser console for errors
2. Verify both users are in the same room
3. Check that users have unmuted their microphones
4. Verify WebRTC connection in browser DevTools
5. Try using headphones to avoid feedback

### Issue: CORS errors in browser console

**Solution:**
Backend CORS is set to allow all origins in development. If you still see errors:
```python
# In main.py, verify:
allow_origins=["*"]
```

### Issue: Port already in use

**Backend (port 8000):**
```bash
# Find process using port 8000
# Mac/Linux:
lsof -i :8000
kill -9 <PID>

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Frontend (port 5173):**
Vite will automatically use next available port (5174, 5175, etc.)

---

## 📝 Code Style Guidelines

### Python (Backend)

- Follow [PEP 8](https://pep8.org/)
- Use docstrings for functions
- Use type hints where appropriate
- Keep functions focused and small

```python
def example_function(param: str) -> dict:
    """
    Brief description of what the function does.
    
    Args:
        param: Description of parameter
        
    Returns:
        Description of return value
    """
    return {"result": param}
```

### JavaScript/React (Frontend)

- Use functional components with hooks
- Use meaningful variable names
- Keep components small and focused
- Use Tailwind classes for styling

```javascript
// Good component structure
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return (
    <div className="tailwind classes">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

---

## 🔄 Git Workflow

```bash
# Create a new branch for your feature
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add: description of changes"

# Push to GitHub
git push origin feature/my-feature

# Create a pull request on GitHub
```

**Commit Message Format:**
- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for changes to existing features
- `Refactor:` for code refactoring
- `Docs:` for documentation changes

---

## 📚 Useful Resources

### WebRTC
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [WebRTC for the Curious](https://webrtcforthecurious.com/)

### FastAPI
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [WebSockets in FastAPI](https://fastapi.tiangolo.com/advanced/websockets/)

### React
- [React Documentation](https://react.dev/)
- [React Hooks](https://react.dev/reference/react)
- [React Router](https://reactrouter.com/)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 💡 Ideas for Future Features

Want to contribute? Here are some ideas:

- [ ] Screen sharing support
- [ ] Chat messaging alongside voice
- [ ] Room passwords/privacy settings
- [ ] Participant limit per room
- [ ] Recording capability
- [ ] Virtual backgrounds
- [ ] Hand raise feature
- [ ] Breakout rooms
- [ ] Admin controls (kick/mute users)
- [ ] Persistent room history
- [ ] Custom room URLs
- [ ] Mobile app (React Native)

---

**Happy coding! 🚀**

If you have questions, create an issue on GitHub.
