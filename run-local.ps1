# UNDUPIFY Local Development Script
# This script helps you run both backend and frontend locally

Write-Host "=== UNDUPIFY Local Development Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "ERROR: Python not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "ERROR: Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Setting up Backend..." -ForegroundColor Yellow

# Check if virtual environment exists
if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Green
    python -m venv .venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
& .\.venv\Scripts\Activate.ps1

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Green
pip install -r requirements.txt

Write-Host ""
Write-Host "Step 2: Setting up Frontend..." -ForegroundColor Yellow

# Navigate to frontend directory
Set-Location frontend-new

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Green
    npm install
}

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Green
    "VITE_API_URL=http://127.0.0.1:8000" | Out-File -FilePath ".env.local" -Encoding utf8
}

Set-Location ..

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "To run the application:" -ForegroundColor Cyan
Write-Host "  1. Backend:  .\run-backend.ps1" -ForegroundColor White
Write-Host "  2. Frontend: .\run-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or run both in separate terminals:" -ForegroundColor Cyan
Write-Host "  Terminal 1: .\.venv\Scripts\python.exe -m uvicorn backend_main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor White
Write-Host "  Terminal 2: cd frontend-new && npm run dev" -ForegroundColor White
Write-Host ""

