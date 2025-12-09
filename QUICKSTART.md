# 🚀 Quick Start Guide - Vokey-Tockey

Get Vokey-Tockey running in under 5 minutes!

## Step 1: Install Dependencies

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Configure Environment

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### Frontend
```bash
cd frontend
echo "VITE_BACKEND_WS_URL=ws://localhost:8000" > .env.local
```

## Step 3: Run the Application

### Terminal 1 - Start Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```

## Step 4: Test It!

1. Open `http://localhost:5173` in two browser windows
2. Click "Create Random Room" in the first window
3. Copy the room ID from the URL
4. In the second window, paste the room ID and click "Join Room"
5. Allow microphone access when prompted
6. Start talking! 🎙️

## Troubleshooting

**Backend not starting?**
- Make sure Python 3.9+ is installed
- Check if port 8000 is available

**Frontend not starting?**
- Make sure Node.js 18+ is installed
- Try `npm install` again
- Check if port 5173 is available

**No audio?**
- Allow microphone permissions in browser
- Check both users are in the same room
- Look for errors in browser console (F12)

## What's Next?

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Read [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide
- Read [TESTING.md](./TESTING.md) for testing strategies
- Check [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for architecture overview

## Quick Commands

```bash
# Backend health check
curl http://localhost:8000/health

# Frontend build for production
cd frontend && npm run build

# Run backend in production mode
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

Happy chatting! 🎉
