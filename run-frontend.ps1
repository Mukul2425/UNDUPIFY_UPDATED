# Run Frontend Development Server
Write-Host "Starting UNDUPIFY Frontend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path "frontend-new\.env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    "VITE_API_URL=http://127.0.0.1:8000" | Out-File -FilePath "frontend-new\.env.local" -Encoding utf8
}

# Navigate to frontend and run
Set-Location frontend-new
npm run dev

