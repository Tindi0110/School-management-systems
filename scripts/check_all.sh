#!/bin/bash
# School Management System - Local Health Check (Bash)
# This script verifies the local development environment and runs basic sanity checks.

# Colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}===========================${NC}"
echo -e "${CYAN} PROJECT HEALTH CHECK (SH)  ${NC}"
echo -e "${CYAN}===========================${NC}"
echo ""

ALL_PASSED=true

# 1. Check Node/NPM
echo -e "${YELLOW}[1/4] Checking Frontend Environment...${NC}"
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo -e "  [PASS] Node.js found: $NODE_VER"
else
    echo -e "  [FAIL] Node.js or NPM not found in PATH."
    echo -e "         Please install Node.js from https://nodejs.org/"
    ALL_PASSED=false
fi

# 2. Check Python/Django
echo -e "${YELLOW}[2/4] Checking Backend Environment...${NC}"
if command -v python3 >/dev/null 2>&1; then
    PY_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PY_BIN="python"
else
    PY_BIN=""
fi

if [ -n "$PY_BIN" ]; then
    PY_VER=$($PY_BIN --version)
    echo -e "  [PASS] Python found: $PY_VER"
    
    # Check for Django
    DJANGO_VER=$($PY_BIN -c "import django; print(django.get_version())" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "  [PASS] Django found: $DJANGO_VER"
    else
        echo -e "  [WARN] Django not found in current Python context."
        echo -e "         Try activating your virtual environment or run: pip install -r backend/requirements.txt"
        ALL_PASSED=false
    fi
else
    echo -e "  [FAIL] Python not found in PATH."
    ALL_PASSED=false
fi

# 3. Frontend Build Check (Optional)
echo -e "${YELLOW}[3/4] Verifying Frontend Configuration...${NC}"
if [ -f "frontend/package.json" ]; then
    echo -e "  [PASS] Frontend package.json located."
else
    echo -e "  [FAIL] frontend/package.json missing."
    ALL_PASSED=false
fi

# 4. Backend Integrity Check
if [ -n "$PY_BIN" ] && [ -n "$DJANGO_VER" ]; then
    echo -e "${YELLOW}[4/4] Verifying Backend Settings...${NC}"
    cd backend
    $PY_BIN manage.py check >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  [PASS] Django system check passed."
    else
        echo -e "  [FAIL] Django system check failed. Run 'python backend/manage.py check' for details."
        ALL_PASSED=false
    fi
    cd ..
fi

echo ""
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}SUCCESS: Your local environment is configured correctly.${NC}"
else
    echo -e "${YELLOW}ATTENTION: Some checks failed. Please review the warnings above.${NC}"
fi
echo ""
