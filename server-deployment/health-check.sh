#!/bin/bash

# CarLedgr Simple Health Check
# Basic service and endpoint checks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

FAILED=0

echo "🔍 CarLedgr Health Check"
echo "======================="
echo ""

# Check Demo Backend Service
info "Checking Demo Backend Service..."
if sudo systemctl is-active --quiet carledgr-demo; then
    success "Demo Backend Service is running"
else
    fail "Demo Backend Service is not running"
    echo "Service status:"
    sudo systemctl status carledgr-demo --no-pager -l
    echo ""
    echo "Recent logs:"
    sudo journalctl -u carledgr-demo --no-pager -l -n 10
    FAILED=1
fi

# Check Production Backend (if it should be running)
if sudo systemctl is-active --quiet carledgr-prod; then
    info "Checking Production Backend Service..."
    if sudo systemctl is-active --quiet carledgr-prod; then
        success "Production Backend Service is running"
    else
        fail "Production Backend Service is not running"
        FAILED=1
    fi
else
    info "Production backend not running (demo-only setup)"
fi

# Simple HTTP checks
info "Checking websites..."

if curl -s https://carledgr.com >/dev/null; then
    success "Marketing Website is responding"
else
    fail "Marketing Website is not responding"
    FAILED=1
fi

if curl -s https://demo.carledgr.com >/dev/null; then
    success "Demo Frontend is responding"
else
    fail "Demo Frontend is not responding"
    FAILED=1
fi

if curl -s https://demo-api.carledgr.com/health >/dev/null; then
    success "Demo API is responding"
else
    fail "Demo API is not responding"
    FAILED=1
fi

echo ""
if [[ $FAILED -eq 0 ]]; then
    success "All checks passed! ✅"
    exit 0
else
    fail "Some checks failed ❌"
    exit 1
fi