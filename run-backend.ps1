# Run Backend Server
Write-Host "Starting UNDUPIFY Backend Server..." -ForegroundColor Cyan
Write-Host "Backend will be available at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API Docs will be available at: http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host ""

# Activate virtual environment and run
& .\.venv\Scripts\Activate.ps1
& .\.venv\Scripts\python.exe -m uvicorn backend_main:app --host 127.0.0.1 --port 8000 --reload

