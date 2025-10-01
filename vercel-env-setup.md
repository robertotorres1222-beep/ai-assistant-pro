# 🚀 Vercel Environment Variables Setup

## Your Supabase Configuration

Add these environment variables to your Vercel project:

### Required Variables:

```bash
VITE_SUPABASE_URL=https://gwcioyqefjywpxjcwbqy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Y2lveXFlZmp5d3B4amN3YnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTQ4NjcsImV4cCI6MjA3NDg3MDg2N30.W5jOcAgdBBUh7I-zIMP5LK2sQ7kYWLCPpGLuJIlsM2I
```

### Optional Variables (for full functionality):

```bash
# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# AI Providers (for chat features)
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
VITE_GOOGLE_API_KEY=your-google-ai-key

# App Configuration
VITE_APP_NAME=AI Assistant Pro
VITE_APP_URL=https://ai-assistant-l9o0yym8k-robertotos-projects.vercel.app
```

## How to Add to Vercel:

1. Go to your Vercel dashboard
2. Select your AI Assistant Pro project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable with its value
6. Make sure to select **Production**, **Preview**, and **Development** environments
7. Click **Save**
8. Go to **Deployments** and click **Redeploy** on your latest deployment

## Database Setup:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/gwcioyqefjywpxjcwbqy
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to create all tables and policies

Your AI Assistant Pro will then be fully functional! 🎉
