# Local Development Quick Start Guide

## Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- PowerShell (Windows)

## Quick Setup

### Option 1: Automated Setup (Recommended)

1. Run the setup script:
   ```powershell
   .\run-local.ps1
   ```

2. Start the backend (Terminal 1):
   ```powershell
   .\run-backend.ps1
   ```

3. Start the frontend (Terminal 2):
   ```powershell
   .\run-frontend.ps1
   ```

### Option 2: Manual Setup

#### Backend

```powershell
# 1. Create virtual environment
python -m venv .venv

# 2. Activate it
.\.venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run server
.\.venv\Scripts\python.exe -m uvicorn backend_main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend

```powershell
# 1. Navigate to frontend directory
cd frontend-new

# 2. Install dependencies
npm install

# 3. Create environment file for local development
"VITE_API_URL=http://127.0.0.1:8000" | Out-File -FilePath ".env.local" -Encoding utf8

# 4. Run development server
npm run dev
```

## Access Points

- **Frontend**: http://localhost:5173 (or port shown in terminal)
- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/health

## Troubleshooting

### Backend Issues

1. **Port already in use**: Change the port in `run-backend.ps1` or kill the process using port 8000
2. **Module not found**: Make sure virtual environment is activated and dependencies are installed
3. **CORS errors**: Check that backend CORS settings in `backend_main.py` include your frontend URL

### Frontend Issues

1. **Cannot connect to backend**: 
   - Verify backend is running on port 8000
   - Check `.env.local` file exists and has correct API URL
   - Restart the frontend dev server after creating `.env.local`

2. **Build errors**: 
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

### Environment Variables

The frontend uses `VITE_API_URL` environment variable:
- **Local**: Set in `frontend-new/.env.local` as `VITE_API_URL=http://127.0.0.1:8000`
- **Production**: Set in Vercel environment variables or leave empty to use default

## Switching Between Local and Production

To test with the deployed backend:
1. Edit `frontend-new/.env.local`
2. Change `VITE_API_URL` to `https://undupify-updated.onrender.com`
3. Restart the frontend dev server

To switch back to local:
1. Change `VITE_API_URL` back to `http://127.0.0.1:8000`
2. Restart the frontend dev server

