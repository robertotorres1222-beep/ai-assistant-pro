# 🚀 AI Assistant Pro - Deployment Guide

This guide covers all deployment options for the AI Assistant Pro application.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm 8+ installed
- ✅ API keys for AI providers (OpenAI, Anthropic, Google AI)
- ✅ Git repository set up
- ✅ Environment variables configured

## 🔧 Quick Setup

1. **Clone and setup**:
```bash
git clone <your-repo-url>
cd ai-assistant-pro
./deploy.sh setup
```

2. **Configure environment**:
```bash
# Edit .env files with your API keys
cp env.example .env
cp env.example backend/.env
# Add your API keys to both files
```

3. **Test locally**:
```bash
npm run full:dev
```

## 🌐 Web Deployment Options

### 1. Vercel (Recommended)

**Fastest and easiest deployment:**

```bash
# One-command deployment
./deploy.sh vercel

# Or manually:
npm run deploy:vercel
```

**Features:**
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Automatic deployments from Git
- ✅ Custom domains

**Configuration:**
- Vercel automatically detects `vercel.json`
- API routes are handled by serverless functions
- Static assets served from CDN

### 2. Netlify

**Great for static sites:**

```bash
# Deploy to Netlify
./deploy.sh netlify

# Or manually:
npm run deploy:netlify
```

**Features:**
- ✅ Form handling
- ✅ Edge functions
- ✅ Branch previews
- ✅ Custom domains
- ✅ Analytics

### 3. GitHub Pages

**Free hosting for public repos:**

```bash
# Deploy to GitHub Pages
./deploy.sh github

# Or manually:
npm run deploy:github
```

**Features:**
- ✅ Free hosting
- ✅ Automatic deployments
- ✅ Custom domains
- ✅ HTTPS support

## 🖥️ Desktop Application

### Build Electron App

```bash
# Build for all platforms
./deploy.sh electron

# Or manually:
npm run desktop:build
```

**Output locations:**
- macOS: `release/mac/`
- Windows: `release/win/`
- Linux: `release/linux/`

### Distribution

The built apps will be in the `release/` directory:
- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer  
- **Linux**: `.AppImage` file

## 🐳 Docker Deployment

### Single Container

```bash
# Build and run Docker container
./deploy.sh docker

# Or manually:
npm run docker:build
npm run docker:run
```

### Docker Compose

```bash
# Run with Docker Compose
npm run docker:compose
```

This starts:
- AI Assistant Pro application
- PostgreSQL database (optional)
- Redis cache (optional)

## ☁️ Cloud Platform Deployment

### AWS

1. **EC2 Instance**:
```bash
# On EC2 instance
git clone <your-repo>
cd ai-assistant-pro
./deploy.sh setup
npm run docker:compose
```

2. **ECS/Fargate**:
```bash
# Build Docker image
docker build -t ai-assistant-pro .

# Push to ECR
aws ecr push ai-assistant-pro:latest
```

### Google Cloud Platform

1. **Cloud Run**:
```bash
# Deploy to Cloud Run
gcloud run deploy ai-assistant-pro \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

2. **Compute Engine**:
```bash
# Deploy to VM
gcloud compute instances create ai-assistant-pro \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud
```

### Azure

1. **App Service**:
```bash
# Deploy to Azure App Service
az webapp up --name ai-assistant-pro --resource-group myResourceGroup
```

2. **Container Instances**:
```bash
# Deploy to ACI
az container create \
  --resource-group myResourceGroup \
  --name ai-assistant-pro \
  --image ai-assistant-pro:latest \
  --ports 3000 3001
```

## 🔐 Production Security

### Environment Variables

**Required for production:**

```bash
# Frontend (.env)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_AI_API_KEY=...

# Backend (backend/.env)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
JWT_SECRET=your-32-char-secret
NODE_ENV=production
```

### Security Headers

The application includes:
- ✅ Content Security Policy (CSP)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ API key encryption

### HTTPS Configuration

For production, ensure:
- ✅ SSL certificates configured
- ✅ HTTPS redirects enabled
- ✅ Secure cookie settings
- ✅ HSTS headers

## 📊 Monitoring & Analytics

### Health Checks

The application includes health check endpoints:
- `GET /api/health` - Application health
- `GET /api/usage` - Usage statistics

### Logging

Logs are written to:
- Console output
- `logs/app.log` file
- `logs/error.log` file

### Performance Monitoring

Monitor:
- ✅ Response times
- ✅ API usage
- ✅ Error rates
- ✅ Resource usage

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy AI Assistant Pro

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy:vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

### Automated Deployments

Set up automatic deployments:
1. Connect your Git repository to deployment platform
2. Configure environment variables in platform
3. Enable automatic deployments on push to main branch

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
```bash
# Clear cache and reinstall
npm run clean:install
npm run build
```

2. **API Key Issues**:
```bash
# Verify environment variables
echo $VITE_OPENAI_API_KEY
echo $OPENAI_API_KEY
```

3. **Port Conflicts**:
```bash
# Check port usage
lsof -i :3000
lsof -i :3001
```

4. **Docker Issues**:
```bash
# Clean Docker cache
docker system prune -a
docker build --no-cache -t ai-assistant-pro .
```

### Debug Mode

Enable debug mode:
```bash
# Set debug environment
export DEBUG=true
export NODE_ENV=development
npm run full:dev
```

## 📈 Scaling

### Horizontal Scaling

For high traffic:
1. Use load balancer (nginx, HAProxy)
2. Deploy multiple instances
3. Use container orchestration (Kubernetes)

### Vertical Scaling

For increased performance:
1. Increase server resources
2. Use caching (Redis)
3. Optimize database queries

## 🎯 Performance Optimization

### Frontend Optimization

- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Bundle analysis

### Backend Optimization

- ✅ Connection pooling
- ✅ Caching strategies
- ✅ Database indexing
- ✅ API rate limiting

## 📞 Support

If you encounter issues:

1. Check the logs: `npm run logs`
2. Verify environment variables
3. Test locally: `npm run full:dev`
4. Check health endpoint: `curl http://localhost:3001/api/health`

## 🎉 Success!

Once deployed, your AI Assistant Pro will be available at:
- **Web**: Your deployment URL
- **Desktop**: Built app in `release/` directory
- **API**: `https://your-domain.com/api/`

**Congratulations! Your AI Assistant Pro is now live!** 🚀
