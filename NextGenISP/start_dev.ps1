$root = $PSScriptRoot
Write-Host "Starting NextGen ISP Development Environment..." -ForegroundColor Green

# 1. Start Backend Server
Write-Host "Launching Backend Server..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList "-NoExit", "-Command", "& {cd backend; .\venv\Scripts\Activate.ps1; python manage.py runserver}"

# 2. Start Frontend Server
Write-Host "Launching Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $root -ArgumentList "-NoExit", "-Command", "& {cd frontend; npm run dev}"

Write-Host "Both servers are starting up!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
