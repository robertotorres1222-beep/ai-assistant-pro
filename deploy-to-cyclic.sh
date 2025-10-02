#!/bin/bash

# Deploy AI Assistant Pro Backend to Cyclic (Free Node.js hosting)

echo "🚀 Deploying to Cyclic..."

# Create a simple deployment package
cd backend

# Create package.json for deployment
cat > package-deploy.json << EOF
{
  "name": "ai-assistant-pro-backend",
  "version": "1.0.0",
  "description": "AI Assistant Pro Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "openai": "^4.28.0",
    "@anthropic-ai/sdk": "^0.27.3",
    "@google/generative-ai": "^0.2.1"
  }
}
EOF

echo "📦 Package created for deployment"
echo ""
echo "🎯 Manual Deployment Instructions:"
echo "1. Go to https://cyclic.sh"
echo "2. Sign up with GitHub"
echo "3. Connect your repository"
echo "4. Set the backend folder as root"
echo "5. Add environment variables:"
echo "   - OPENAI_API_KEY=your_key"
echo "   - ANTHROPIC_API_KEY=your_key" 
echo "   - GOOGLE_AI_API_KEY=your_key"
echo "   - ALLOWED_ORIGINS=https://ai-assistant-c7ktnvjxz-robertotos-projects.vercel.app"
echo ""
echo "✅ Backend is ready for deployment!"

cd ..
