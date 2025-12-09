# Deploy Vokey-Tockey to Cloud (Free Hosting)

Since you can't test locally, let's deploy to free cloud services!

## 🚀 Quick Deploy Options

### Option 1: Deploy Backend to Render (Recommended)
**Free tier available, no credit card needed**

1. **Push your code to GitHub first**:
   ```bash
   cd /workspaces/vokey-tockey
   git add .
   git commit -m "Initial Vokey-Tockey implementation"
   git push origin main
   ```

2. **Deploy Backend to Render**:
   - Go to https://render.com
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Connect your `vokey-tockey` repository
   - Configure:
     - **Name**: `vokey-tockey-backend`
     - **Environment**: `Python 3`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Root Directory**: `backend`
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Copy the URL (e.g., `https://vokey-tockey-backend.onrender.com`)

3. **Deploy Frontend to Vercel**:
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click "Add New" → "Project"
   - Import your `vokey-tockey` repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Environment Variable**: 
       - Name: `VITE_BACKEND_WS_URL`
       - Value: `wss://vokey-tockey-backend.onrender.com` (use your Render URL, replace `https` with `wss`)
   - Click "Deploy"
   - Wait 1-2 minutes
   - You'll get a URL like `https://vokey-tockey.vercel.app`

4. **Update CORS in Backend**:
   After deploying, you need to update backend CORS settings.
   See instructions below.

---

## Option 2: All-in-One Deploy Script

I'll create scripts to help you deploy automatically!

### For GitHub + Render + Vercel:

**Step 1: Push to GitHub**
```bash
cd /workspaces/vokey-tockey
git add .
git commit -m "Complete Vokey-Tockey app"
git push origin main
```

**Step 2: Deploy Backend (Render)**
- Manual deployment via Render dashboard (see Option 1)
- Or use Render Blueprint (see below)

**Step 3: Deploy Frontend (Vercel)**
- Use Vercel CLI or dashboard (see below)

---

## 📋 Detailed Steps

### A. Push to GitHub (Required First!)

```bash
cd /workspaces/vokey-tockey

# Initialize git if not already done
git status

# Add all files
git add .

# Commit
git commit -m "Complete Vokey-Tockey implementation"

# Push to your repository
git push origin main
```

### B. Backend: Render.com Deployment

1. **Create account**: https://render.com (use GitHub)

2. **Create render.yaml** (I'll create this for you below)

3. **Connect repository** and deploy

4. **Get backend URL**: `https://your-app.onrender.com`

### C. Frontend: Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```
   
3. **Set environment variable** when prompted:
   - `VITE_BACKEND_WS_URL=wss://your-backend.onrender.com`

4. **Get frontend URL**: `https://your-app.vercel.app`

---

## 🔧 Configuration Files Needed

### For Render (Backend)

Create `render.yaml` in root:
```yaml
services:
  - type: web
    name: vokey-tockey-backend
    env: python
    region: oregon
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    rootDir: backend
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

### For Vercel (Frontend)

Create `vercel.json` in frontend/:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_BACKEND_WS_URL": "wss://vokey-tockey-backend.onrender.com"
  }
}
```

---

## ⚠️ Important: Update Backend CORS

After deploying frontend, update `backend/main.py`:

Find this line:
```python
allow_origins=["*"],  # In production, specify your frontend domain
```

Replace with your Vercel URL:
```python
allow_origins=[
    "https://your-app.vercel.app",
    "http://localhost:5173"  # Keep for local dev
],
```

Then redeploy backend!

---

## 🎯 Expected Results

After deployment:
- **Backend URL**: `https://vokey-tockey-backend.onrender.com`
- **Frontend URL**: `https://vokey-tockey.vercel.app`
- **Health Check**: `https://vokey-tockey-backend.onrender.com/health`

---

## 🧪 Testing Your Deployed App

1. Open frontend URL in browser
2. Click "Create Random Room"
3. Allow microphone access
4. Copy room URL
5. Open same URL in another device/browser
6. Both should connect and you can talk!

---

## 💰 Costs

- **Render Free Tier**: 
  - ✅ Free forever
  - 750 hours/month
  - Spins down after 15min inactivity (cold starts ~30s)
  
- **Vercel Free Tier**:
  - ✅ Free forever
  - Unlimited bandwidth
  - 100GB bandwidth/month

---

## 🐛 Common Issues

**Backend not accessible?**
- Check Render logs
- Ensure `PORT` env var is used
- Check if service is running

**WebSocket connection fails?**
- Use `wss://` not `ws://` for HTTPS
- Ensure CORS is configured
- Check browser console

**Render free tier sleeps?**
- First request takes ~30s (cold start)
- Keep alive with ping service (optional)

---

## 🚀 Alternative: Railway.app

If Render doesn't work:

1. Go to https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select `vokey-tockey`
5. Add service → `backend`
6. Environment vars: `PORT=8000`
7. Deploy!

---

## 📞 Need Help?

Let me know which deployment method you prefer and I'll:
1. Create all necessary config files
2. Guide you through the deployment
3. Help troubleshoot any issues

**Recommended**: Render (backend) + Vercel (frontend) = Easiest!
