# School Management System - Local Health Check (PowerShell)
# This script verifies the local development environment and runs basic sanity checks.

$ErrorActionPreference = "Continue"

Write-Host "===========================" -ForegroundColor Cyan
Write-Host " PROJECT HEALTH CHECK (PS1) " -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

$AllPassed = $true

# 1. Check Node/NPM
Write-Host "[1/4] Checking Frontend Environment..." -ForegroundColor Yellow
$NodePath = Get-Command node -ErrorAction SilentlyContinue
$NPMPath = Get-Command npm -ErrorAction SilentlyContinue

if ($NodePath -and $NPMPath) {
    $NodeVer = node -v
    Write-Host "  [PASS] Node.js found: $NodeVer" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Node.js or NPM not found in PATH." -ForegroundColor Red
    Write-Host "         Please install Node.js from https://nodejs.org/" -ForegroundColor Gray
    $AllPassed = $false
}

# 2. Check Python/Django
Write-Host "[2/4] Checking Backend Environment..." -ForegroundColor Yellow
$PythonPath = Get-Command python -ErrorAction SilentlyContinue

if ($PythonPath) {
    $PyVer = python --version
    Write-Host "  [PASS] Python found: $PyVer" -ForegroundColor Green
    
    # Check for Django
    $DjangoCheck = python -c "import django; print(django.get_version())" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] Django found: $DjangoCheck" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Django not found in current Python context." -ForegroundColor Yellow
        Write-Host "         Try activating your virtual environment or run: pip install -r backend/requirements.txt" -ForegroundColor Gray
        $AllPassed = $false
    }
} else {
    Write-Host "  [FAIL] Python not found in PATH." -ForegroundColor Red
    $AllPassed = $false
}

# 3. Frontend Build Check (Optional)
if ($NodePath -and $NPMPath) {
    Write-Host "[3/4] Verifying Frontend Configuration..." -ForegroundColor Yellow
    if (Test-Path "frontend/package.json") {
        Write-Host "  [PASS] Frontend package.json located." -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] frontend/package.json missing." -ForegroundColor Red
        $AllPassed = $false
    }
}

# 4. Backend Integrity Check
if ($PythonPath -and $DjangoCheck) {
    Write-Host "[4/4] Verifying Backend Settings..." -ForegroundColor Yellow
    Push-Location backend
    python manage.py check 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [PASS] Django system check passed." -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Django system check failed. Run 'python backend/manage.py check' for details." -ForegroundColor Red
        $AllPassed = $false
    }
    Pop-Location
}

Write-Host ""
if ($AllPassed) {
    Write-Host "SUCCESS: Your local environment is configured correctly." -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Some checks failed. Please review the warnings above." -ForegroundColor Yellow
}
Write-Host ""
