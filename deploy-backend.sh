#!/bin/bash

# AI Assistant Pro Backend - Railway Deployment Script

echo "🚀 Deploying AI Assistant Pro Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Navigate to backend directory
cd backend

# Deploy to Railway
echo "🚀 Deploying backend to Railway..."
railway up

# Get the deployment URL
echo "📋 Getting deployment URL..."
RAILWAY_URL=$(railway status | grep "https://" | head -1 | awk '{print $NF}')

if [ -n "$RAILWAY_URL" ]; then
    echo "✅ Backend deployed successfully!"
    echo "🌐 Backend URL: $RAILWAY_URL"
    echo "🔗 Health check: $RAILWAY_URL/api/health"
    
    # Update environment variables in Railway
    echo "⚙️ Setting up environment variables..."
    echo "Please add your API keys in Railway dashboard:"
    echo "1. Go to: https://railway.app/dashboard"
    echo "2. Select your project"
    echo "3. Go to Variables tab"
    echo "4. Add these environment variables:"
    echo "   - OPENAI_API_KEY=your_openai_key"
    echo "   - ANTHROPIC_API_KEY=your_anthropic_key"
    echo "   - GOOGLE_AI_API_KEY=your_google_key"
    echo "   - ALLOWED_ORIGINS=https://ai-assistant-c7ktnvjxz-robertotos-projects.vercel.app"
    
    echo ""
    echo "🎉 Backend deployment complete!"
    echo "📝 Next steps:"
    echo "1. Add API keys in Railway dashboard"
    echo "2. Test the backend: curl $RAILWAY_URL/api/health"
    echo "3. Update frontend to use: $RAILWAY_URL"
    
else
    echo "❌ Failed to get deployment URL"
    echo "Please check Railway dashboard for deployment status"
fi

cd ..
