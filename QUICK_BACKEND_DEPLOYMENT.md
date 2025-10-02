# 🚀 Quick Backend Deployment Guide

## Option 1: Railway (Recommended - FREE)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

### Step 2: Deploy from GitHub
1. **Connect Repository**: Select your GitHub repository
2. **Deploy**: Railway will automatically detect the backend folder
3. **Set Root Directory**: Make sure it's set to `backend`

### Step 3: Configure Environment Variables
In Railway dashboard, go to Variables tab and add:

```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://ai-assistant-c7ktnvjxz-robertotos-projects.vercel.app
```

### Step 4: Deploy
Railway will automatically build and deploy your backend!

---

## Option 2: Render (FREE Alternative)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy
1. **New Web Service**: Create new web service
2. **Connect Repository**: Connect your GitHub repo
3. **Settings**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

### Step 3: Environment Variables
Add the same variables as Railway

---

## Option 3: Heroku (Paid)

### Step 1: Install Heroku CLI
```bash
# macOS
brew install heroku

# Or download from heroku.com
```

### Step 2: Deploy
```bash
cd backend
heroku create ai-assistant-pro-backend
heroku config:set OPENAI_API_KEY=your_key
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set GOOGLE_AI_API_KEY=your_key
git subtree push --prefix=backend heroku main
```

---

## Option 4: Local Development

### Start Backend Locally
```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:3001`

---

## Testing Your Deployment

Once deployed, test with:

```bash
# Health check
curl https://your-backend-url.com/api/health

# Chat test
curl -X POST https://your-backend-url.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "openai",
    "model": "gpt-4o"
  }'
```

---

## Update Frontend

After deploying backend, update your frontend:

1. **Get Backend URL** from Railway/Render/Heroku
2. **Update Environment Variables** in Vercel:
   - Go to Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `VITE_BACKEND_URL=https://your-backend-url.com`

---

## Recommended: Railway

Railway is the best option because:
- ✅ **FREE** tier with 500 hours/month
- ✅ **Easy** GitHub integration
- ✅ **Automatic** deployments
- ✅ **Built-in** environment variables
- ✅ **Custom** domains
- ✅ **Great** performance

---

## Quick Deploy Commands

### Railway
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Connect GitHub repository
4. Set root directory to `backend`
5. Add environment variables
6. Deploy!

### Render
1. Go to [render.com](https://render.com)
2. Click "New Web Service"
3. Connect GitHub repository
4. Set root directory to `backend`
5. Add environment variables
6. Deploy!

---

## Success Indicators

✅ **Backend deployed successfully when:**
- Health check returns: `{"status":"healthy"}`
- Chat endpoint responds with AI content
- Environment variables are set
- CORS is configured correctly

🎉 **Your AI Assistant Pro will be fully functional!**
