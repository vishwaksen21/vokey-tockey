# 🚀 EASIEST Way to Deploy & Test Vokey-Tockey

Since you can't test locally, here's the **SIMPLEST** deployment path:

## ⚡ Quick Deploy (5 minutes)

### Step 1: Push Code to GitHub ✅

You're already in a GitHub Codespace, so just commit and push:

```bash
cd /workspaces/vokey-tockey
git add .
git commit -m "Complete Vokey-Tockey app"
git push origin main
```

---

### Step 2: Deploy Backend to Render (2 mins) 🐍

**Why Render?** Free, auto-deploys from GitHub, perfect for FastAPI + WebSockets

1. **Go to**: https://render.com
2. **Sign in** with your GitHub account
3. Click **"New +"** → **"Web Service"**
4. **Connect** your `vokey-tockey` repository
5. Render will **auto-detect** the `render.yaml` file I created
6. Click **"Apply"** then **"Create Web Service"**
7. ⏱️ Wait 2-3 minutes for build
8. ✅ Copy your backend URL: `https://vokey-tockey-backend-XXXX.onrender.com`

**Important**: Replace `https` with `wss` for WebSocket URL:
- Backend URL: `https://vokey-tockey-backend-XXXX.onrender.com`
- WebSocket URL: `wss://vokey-tockey-backend-XXXX.onrender.com` ← Use this!

---

### Step 3: Deploy Frontend to Vercel (2 mins) ⚛️

**Why Vercel?** Made for React/Vite, super fast, free forever

1. **Go to**: https://vercel.com
2. **Sign in** with your GitHub account
3. Click **"Add New"** → **"Project"**
4. **Import** your `vokey-tockey` repository
5. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
6. **Add Environment Variable**:
   - Click "Environment Variables"
   - **Name**: `VITE_BACKEND_WS_URL`
   - **Value**: `wss://vokey-tockey-backend-XXXX.onrender.com` (from Step 2)
7. Click **"Deploy"**
8. ⏱️ Wait 1-2 minutes
9. ✅ You'll get: `https://vokey-tockey-XXXX.vercel.app`

---

### Step 4: Update CORS (30 seconds) 🔒

After deploying frontend, update backend to allow your domain:

1. Edit `backend/main.py` in your repository
2. Find line ~30:
   ```python
   allow_origins=["*"],  # In production, specify your frontend domain
   ```
3. Replace with:
   ```python
   allow_origins=[
       "https://vokey-tockey-XXXX.vercel.app",  # Your Vercel URL
       "http://localhost:5173"  # Keep for local testing
   ],
   ```
4. Commit and push:
   ```bash
   git add backend/main.py
   git commit -m "Update CORS for production"
   git push origin main
   ```
5. Render will **auto-redeploy** in 1-2 minutes

---

## 🎉 TEST YOUR APP!

1. Open your Vercel URL: `https://vokey-tockey-XXXX.vercel.app`
2. Click **"Create Random Room"**
3. Allow microphone access
4. Open the **same URL** on your phone or another device
5. Enter the **same room ID**
6. **Talk and hear each other!** 🎙️

---

## 📱 Test on Multiple Devices

- **Your phone**: Open the Vercel URL
- **Another phone**: Open the same Vercel URL
- **Friend's device**: Share the Vercel URL
- **Different browser**: Chrome, Firefox, Safari

All can join the same room and talk!

---

## 🐛 Troubleshooting

### Backend not responding?
- Check Render dashboard logs
- Wait 30 seconds (free tier has cold starts)
- Visit health endpoint: `https://your-backend.onrender.com/health`

### WebSocket fails to connect?
- Make sure you used `wss://` not `ws://`
- Check browser console (F12)
- Verify environment variable in Vercel

### No audio?
- Allow microphone permission in browser
- HTTPS is required (Vercel provides this automatically)
- Try different browser (Chrome works best)

### Can't hear other person?
- Both need microphone permission
- Check speaking indicator shows activity
- Try refreshing both browsers

---

## 💡 Pro Tips

1. **Free Tier Limits**:
   - Render: Sleeps after 15min inactivity (30s wake time)
   - Vercel: Always active, instant

2. **Keep Backend Awake** (Optional):
   - Use https://uptimerobot.com to ping your backend every 5 minutes
   - Prevents cold starts

3. **Custom Domain** (Optional):
   - Vercel: Add custom domain in dashboard
   - Update CORS settings accordingly

4. **Monitoring**:
   - Render: View logs in dashboard
   - Vercel: View build/runtime logs
   - Browser: DevTools console (F12)

---

## 🎯 What You'll Get

- ✅ **Backend**: `https://vokey-tockey-backend-XXXX.onrender.com`
- ✅ **Frontend**: `https://vokey-tockey-XXXX.vercel.app`
- ✅ **WebSocket**: `wss://vokey-tockey-backend-XXXX.onrender.com`
- ✅ **Works on**: Any device with browser + internet
- ✅ **Cost**: $0.00 (100% free!)

---

## 🔥 Alternative: Railway (If Render doesn't work)

Railway is another great option:

1. Go to: https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select `vokey-tockey`
5. Add service → Select `backend` directory
6. Deploy!
7. Railway auto-detects Python + generates URL

Then update Vercel environment variable with Railway URL.

---

## 📞 Need Help?

If you get stuck:

1. **Check deployment logs** in Render/Vercel dashboard
2. **Browser console** (F12) shows frontend errors
3. **Test health endpoint**: `https://your-backend.onrender.com/health`
4. **Read**: `TROUBLESHOOTING.md`

---

## ⏱️ Timeline

- Push to GitHub: 30 seconds
- Deploy backend (Render): 2-3 minutes
- Deploy frontend (Vercel): 1-2 minutes
- Update CORS: 30 seconds
- **Total**: ~5 minutes

Then you can test from **anywhere**! 🌍

---

**Ready?** Start with Step 1 above! 🚀
