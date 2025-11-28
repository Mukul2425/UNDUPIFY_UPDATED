# Deployment Guide

## Auto-Deployment Status

✅ **Both Vercel and Render are configured for auto-deployment from GitHub**

When you push changes to your GitHub repository:
- **Vercel (Frontend)**: Automatically detects changes and deploys
- **Render (Backend)**: Automatically detects changes and deploys (if auto-deploy is enabled)

## What Happens When You Push

### Frontend (Vercel)
1. Vercel detects the push to your connected branch
2. Runs build using `vercel.json` configuration:
   - Sets root directory to `frontend-new`
   - Installs dependencies (`npm install`)
   - Builds the project (`npm run build`)
   - Serves from `dist` directory
3. Frontend uses default API URL: `https://undupify-updated.onrender.com`
   - (No environment variable needed - it's the default in `config.ts`)

### Backend (Render)
1. Render detects the push (if auto-deploy enabled)
2. Installs dependencies from `requirements.txt`
3. Starts server with: `uvicorn backend_main:app --host 0.0.0.0 --port $PORT`
4. CORS is already configured to allow requests from Vercel

## Verifying Auto-Deploy

### Vercel
1. Go to your Vercel dashboard
2. Check project settings → Git
3. Ensure "Auto-deploy" is enabled for your branch (usually `main` or `master`)

### Render
1. Go to your Render dashboard
2. Select your backend service
3. Check "Settings" → "Auto-Deploy"
4. Ensure it's set to "Yes" and connected to the correct branch

## Manual Deployment (If Needed)

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Render
- Use "Manual Deploy" button in Render dashboard
- Or trigger via Render API

## Environment Variables

### Frontend (Vercel)
**Optional** - The frontend will use the default production API URL if not set:
- Variable: `VITE_API_URL`
- Value: `https://undupify-updated.onrender.com` (or leave empty to use default)

To set in Vercel:
1. Go to Project Settings → Environment Variables
2. Add `VITE_API_URL` = `https://undupify-updated.onrender.com`
3. Redeploy

### Backend (Render)
No additional environment variables needed - CORS is already configured.

## Troubleshooting

### Vercel Build Fails
1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing dependencies → Check `package.json`
   - TypeScript errors → Fix before pushing
   - Build command issues → Check `vercel.json`

### Render Deployment Fails
1. Check deployment logs in Render dashboard
2. Common issues:
   - Missing Python dependencies → Check `requirements.txt`
   - Port configuration → Should use `$PORT` environment variable
   - CORS errors → Already configured in `backend_main.py`

### Frontend Can't Connect to Backend
1. Verify backend is running: Check `https://undupify-updated.onrender.com/health`
2. Check CORS settings in `backend_main.py` include your Vercel URL
3. Verify API URL in frontend config (should default to Render URL)

## Current Configuration

- **Frontend URL**: `https://undupify-updated.vercel.app` (or your Vercel domain)
- **Backend URL**: `https://undupify-updated.onrender.com` (or your Render domain)
- **API Default**: Frontend automatically uses Render URL in production

## Next Steps After Push

1. **Wait for deployments** (usually 2-5 minutes)
2. **Check deployment status** in both dashboards
3. **Test the application**:
   - Visit your Vercel URL
   - Try uploading a file
   - Check browser console for errors
4. **Monitor logs** if issues occur

