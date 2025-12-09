# 🚀 Deployment Guide - Vokey-Tockey

This guide covers deploying Vokey-Tockey to production environments.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- **Backend**: Python 3.9+, pip
- **Frontend**: Node.js 18+, npm
- **Domain**: A domain name (for HTTPS/WSS)
- **SSL Certificate**: Required for WebRTC to work in browsers

---

## 🔧 Backend Deployment (FastAPI)

### Option 1: Deploy to Render.com

Render provides free hosting with built-in SSL.

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select Python environment
   - Set build command: `cd backend && pip install -r requirements.txt`
   - Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Environment Variables** (in Render dashboard)
   ```
   PYTHON_VERSION=3.9
   ```

3. **Your backend will be available at:**
   ```
   https://your-app-name.onrender.com
   ```

### Option 2: Deploy to Railway.app

1. **Create new project from GitHub**
2. **Configure settings:**
   - Root directory: `backend`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add environment variables if needed**

### Option 3: Deploy to a VPS (Ubuntu)

**SSH into your server:**

```bash
ssh user@your-server-ip
```

**Install dependencies:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.9+
sudo apt install python3 python3-pip python3-venv -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

**Set up the application:**

```bash
# Clone your repository
git clone https://github.com/yourusername/vokey-tockey.git
cd vokey-tockey/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Gunicorn for production
pip install gunicorn
```

**Create systemd service:**

```bash
sudo nano /etc/systemd/system/vokey-tockey.service
```

**Add this configuration:**

```ini
[Unit]
Description=Vokey-Tockey FastAPI Server
After=network.target

[Service]
User=your-username
Group=www-data
WorkingDirectory=/home/your-username/vokey-tockey/backend
Environment="PATH=/home/your-username/vokey-tockey/backend/venv/bin"
ExecStart=/home/your-username/vokey-tockey/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
```

**Start the service:**

```bash
sudo systemctl start vokey-tockey
sudo systemctl enable vokey-tockey
sudo systemctl status vokey-tockey
```

**Configure Nginx:**

```bash
sudo nano /etc/nginx/sites-available/vokey-tockey
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/vokey-tockey /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Get SSL certificate:**

```bash
sudo certbot --nginx -d api.yourdomain.com
```

**Your backend is now available at:**
```
https://api.yourdomain.com
```

---

## 🎨 Frontend Deployment (React)

### Option 1: Deploy to Vercel

Vercel is the easiest option for React apps.

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

3. **Create production environment file:**
   ```bash
   # .env.production
   VITE_BACKEND_WS_URL=wss://your-backend-domain.com
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Configure in Vercel dashboard:**
   - Add environment variable: `VITE_BACKEND_WS_URL`
   - Value: `wss://api.yourdomain.com` (or your Render/Railway URL)

### Option 2: Deploy to Netlify

1. **Build the app:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Set environment variables in Netlify dashboard:**
   - `VITE_BACKEND_WS_URL` = `wss://your-backend-url`

### Option 3: Deploy to Nginx (same VPS)

**Build the frontend:**

```bash
cd frontend

# Create production env file
echo "VITE_BACKEND_WS_URL=wss://api.yourdomain.com" > .env.production

# Build
npm install
npm run build
```

**Copy build files to server:**

```bash
scp -r dist/* user@your-server:/var/www/vokey-tockey/
```

**Configure Nginx:**

```bash
sudo nano /etc/nginx/sites-available/vokey-tockey-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/vokey-tockey;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable and get SSL:**

```bash
sudo ln -s /etc/nginx/sites-available/vokey-tockey-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔐 Important Production Considerations

### 1. CORS Configuration

Update backend `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Environment Variables

**Backend (.env):**
```bash
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
MAX_USERS_PER_ROOM=20
```

**Frontend (.env.production):**
```bash
VITE_BACKEND_WS_URL=wss://api.yourdomain.com
```

### 3. HTTPS/WSS is REQUIRED

WebRTC **requires HTTPS** in production. Browsers will block getUserMedia on HTTP.

- Frontend: HTTPS
- Backend WebSocket: WSS (secure WebSocket)

### 4. Firewall Configuration

If using VPS:

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 5. STUN/TURN Servers

For better connectivity, consider using your own TURN server:

**Install coturn:**

```bash
sudo apt install coturn -y
```

**Configure** (`/etc/turnserver.conf`):
```
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=your-secret-key
realm=yourdomain.com
```

**Update frontend WebRTC config:**

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:yourdomain.com:3478',
      username: 'user',
      credential: 'password'
    }
  ]
};
```

---

## 📊 Monitoring & Logs

### Backend Logs (systemd)

```bash
# View logs
sudo journalctl -u vokey-tockey -f

# View last 100 lines
sudo journalctl -u vokey-tockey -n 100
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Monitoring

Consider using:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Prometheus + Grafana** for metrics

---

## 🧪 Testing Production Deployment

1. **Test HTTPS:**
   ```bash
   curl https://yourdomain.com
   curl https://api.yourdomain.com/health
   ```

2. **Test WebSocket:**
   Use a tool like [WebSocket King](https://websocketking.com/)
   - Connect to: `wss://api.yourdomain.com/ws/rooms/test-room`

3. **Test WebRTC:**
   - Open two browser windows
   - Create a room in one
   - Join same room in another
   - Verify voice connection works

---

## 🔄 Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 🆘 Troubleshooting Production Issues

### Issue: WebSocket not connecting

**Solution:**
- Check WSS URL in frontend env
- Verify SSL certificate is valid
- Check Nginx WebSocket proxy settings
- Check firewall allows port 443

### Issue: No audio in production

**Solution:**
- Verify HTTPS is enabled (required for getUserMedia)
- Check microphone permissions in browser
- Test with STUN/TURN server
- Check browser console for errors

### Issue: High latency

**Solution:**
- Use TURN server closer to users
- Optimize number of peers (max 10-15)
- Check server resources (CPU/memory)
- Consider using a CDN for frontend

---

## 📈 Scaling Considerations

For handling more users:

1. **Horizontal Scaling:**
   - Use multiple backend instances
   - Implement Redis for session storage
   - Use load balancer (Nginx, HAProxy)

2. **Database (optional):**
   - Add PostgreSQL for room history
   - Store analytics data

3. **Media Server (for large groups):**
   - Use Janus, Mediasoup, or Jitsi
   - Implement SFU (Selective Forwarding Unit)

---

## ✅ Production Checklist

- [ ] SSL certificates installed
- [ ] Environment variables configured
- [ ] CORS properly set up
- [ ] Firewall configured
- [ ] Logging enabled
- [ ] Error monitoring set up
- [ ] Tested on multiple browsers
- [ ] Tested with multiple users
- [ ] Documentation updated
- [ ] Backup strategy in place

---

**Your Vokey-Tockey app is now production-ready! 🎉**

For issues, check logs and browser console first. Most WebRTC issues are related to HTTPS/SSL configuration.
