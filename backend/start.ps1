Write-Host "Starting FastAPI Backend..." -ForegroundColor Green
Write-Host "Using virtual environment..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
& "c:\Users\Testimony Adegoke\CascadeProjects\hommesestates\.venv\Scripts\uvicorn.exe" app.main:app --reload --port 8000
