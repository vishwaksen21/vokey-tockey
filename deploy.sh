#!/bin/bash

# Vokey-Tockey Cloud Deployment Script
# This script helps you deploy to Render (backend) and Vercel (frontend)

set -e

echo "🚀 Vokey-Tockey Cloud Deployment Helper"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git repository not found!"
    echo "Please initialize git and connect to GitHub first:"
    echo ""
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/vokey-tockey.git"
    echo "  git push -u origin main"
    echo ""
    exit 1
fi

echo "✅ Git repository detected"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "📝 Uncommitted changes detected. Committing..."
    git add .
    git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

echo ""
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub"
echo ""

# Instructions for manual deployment
echo "🎯 Next Steps - Deploy Your App:"
echo ""
echo "================================"
echo "BACKEND (Render.com):"
echo "================================"
echo "1. Go to: https://render.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Select your 'vokey-tockey' repository"
echo "5. Render will auto-detect 'render.yaml'"
echo "6. Click 'Apply' and 'Create Web Service'"
echo "7. Wait 2-3 minutes for deployment"
echo "8. Copy the backend URL (e.g., https://vokey-tockey-backend.onrender.com)"
echo ""
echo "================================"
echo "FRONTEND (Vercel):"
echo "================================"
echo "1. Go to: https://vercel.com"
echo "2. Sign up/Login with GitHub"
echo "3. Click 'Add New' → 'Project'"
echo "4. Import 'vokey-tockey' repository"
echo "5. Root Directory: 'frontend'"
echo "6. Framework Preset: Vite"
echo "7. Add Environment Variable:"
echo "   Name: VITE_BACKEND_WS_URL"
echo "   Value: wss://YOUR-BACKEND-URL.onrender.com"
echo "   (Replace https with wss from step 8 above)"
echo "8. Click 'Deploy'"
echo "9. Wait 1-2 minutes"
echo "10. You'll get a URL like: https://vokey-tockey.vercel.app"
echo ""
echo "================================"
echo "FINAL STEP - Update CORS:"
echo "================================"
echo "After deploying frontend:"
echo "1. Edit 'backend/main.py'"
echo "2. Find: allow_origins=['*']"
echo "3. Replace with: allow_origins=['https://your-app.vercel.app']"
echo "4. Commit and push changes"
echo "5. Render will auto-redeploy"
echo ""
echo "🎉 Then test your live app!"
echo ""
echo "Need help? Check DEPLOY_TO_CLOUD.md"
