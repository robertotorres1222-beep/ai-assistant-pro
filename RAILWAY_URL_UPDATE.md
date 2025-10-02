# 🔧 Update Railway URL in Frontend

## 🚀 **Next Step: Update Your Railway URL**

You need to replace the placeholder URL in the frontend with your actual Railway URL.

### **Step 1: Get Your Railway URL**
1. **Go to**: Railway dashboard
2. **Click**: Your project (`ai-assistant-pro`)
3. **Copy**: The public URL (should be something like `https://ai-assistant-pro-production-xxxx.railway.app`)

### **Step 2: Update Frontend Configuration**
**Edit**: `src/services/backendAIService.ts`

**Find this line** (around line 8):
```typescript
const RAILWAY_URL = 'https://ai-assistant-pro-production-xxxx.railway.app'
```

**Replace with your actual Railway URL**:
```typescript
const RAILWAY_URL = 'https://your-actual-railway-url.railway.app'
```

### **Step 3: Redeploy Frontend**
After updating the URL, redeploy your frontend:
```bash
npm run build
npm run deploy
```

---

## 🎯 **Alternative: Environment Variable**

You can also set the URL as an environment variable:

### **In Vercel Dashboard:**
1. **Go to**: Your Vercel project settings
2. **Add Environment Variable**:
   - **Name**: `VITE_RAILWAY_URL`
   - **Value**: `https://your-actual-railway-url.railway.app`

### **Update the service to use environment variable:**
```typescript
const RAILWAY_URL = import.meta.env.VITE_RAILWAY_URL || 'https://ai-assistant-pro-production-xxxx.railway.app'
```

---

## 🔍 **How to Find Your Railway URL:**

1. **Railway Dashboard** → Your Project
2. **Settings** → **Domains**
3. **Copy** the generated domain URL

**Or check the deployment logs for the URL!**

---

## ✅ **Test Connection:**

Once updated, your frontend will show:
- **Green dot**: Backend connected ✅
- **Red dot**: Backend disconnected ❌

**The backend status will appear in the chat interface header!**
