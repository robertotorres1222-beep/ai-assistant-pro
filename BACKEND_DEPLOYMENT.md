# 🚀 Backend Deployment Instructions

## Option 1: Railway (Recommended - Free)

### Step 1: Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Deploy Backend
1. **Connect Repository**: Connect your GitHub repository
2. **Select Backend Folder**: Choose the `backend` folder as the root
3. **Set Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here
   NODE_ENV=production
   PORT=3001
   ALLOWED_ORIGINS=https://ai-assistant-94ll93d6x-robertotos-projects.vercel.app,https://ai-assistant-13sh6yauv-robertotos-projects.vercel.app
   ```
4. **Deploy**: Railway will automatically build and deploy

### Step 3: Get Backend URL
- Railway will provide a URL like: `https://your-app-name.railway.app`
- Update your frontend to use this URL

## Option 2: Render (Free Alternative)

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy Backend
1. **New Web Service**: Create a new web service
2. **Connect Repository**: Connect your GitHub repository
3. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### Step 3: Environment Variables
Add the same environment variables as Railway

## Option 3: Heroku (Paid)

### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Or download from https://devcenter.heroku.com/articles/heroku-cli
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

## Option 4: Local Development

### Start Backend Locally
```bash
cd backend
npm install
npm start
```

Backend will run on `http://localhost:3001`

## Environment Variables Required

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
GOOGLE_AI_API_KEY=your_google_ai_key_here

# Server Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-vercel-app.vercel.app
```

## Testing Backend

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

## Update Frontend

After deploying backend, update your frontend environment variables:

```bash
# In Vercel dashboard or .env file
VITE_BACKEND_URL=https://your-backend-url.com
```

## Cost Estimates

### Railway
- **Free Tier**: 500 hours/month
- **Hobby Plan**: $5/month for unlimited usage

### Render
- **Free Tier**: 750 hours/month
- **Starter Plan**: $7/month for always-on

### Heroku
- **Basic Plan**: $7/month
- **No free tier** (as of 2022)

## Recommended: Railway

Railway is the best option because:
- ✅ Free tier with 500 hours
- ✅ Easy GitHub integration
- ✅ Automatic deployments
- ✅ Built-in environment variables
- ✅ Custom domains
- ✅ Great performance
