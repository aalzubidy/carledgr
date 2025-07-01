#!/bin/bash

# CarLedgr Health Check Script
# Check all services and endpoints - fail on any issue

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Track overall health
FAILED_CHECKS=0
TOTAL_CHECKS=0

# Function to check systemd service
check_service() {
    local service_name=$1
    local display_name=$2
    
    ((TOTAL_CHECKS++))
    info "Checking $display_name..."
    
    if sudo systemctl is-active --quiet "$service_name"; then
        success "$display_name is running"
    else
        fail "$display_name is not running"
        sudo systemctl status "$service_name" --no-pager -l || true
        ((FAILED_CHECKS++))
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    
    ((TOTAL_CHECKS++))
    info "Checking $name..."
    
    local response
    response=$(curl -s -w "%{http_code}" "$url" --max-time 10 --connect-timeout 5 2>/dev/null)
    local http_code="${response: -3}"
    
    if [[ "$http_code" =~ ^[2-3][0-9][0-9]$ ]]; then
        success "$name is responding (HTTP $http_code)"
    else
        fail "$name is not responding (HTTP $http_code)"
        ((FAILED_CHECKS++))
    fi
}

# Function to check API health endpoint
check_api_health() {
    local url=$1
    local name=$2
    
    ((TOTAL_CHECKS++))
    info "Checking $name API health..."
    
    local response
    response=$(curl -s "$url/health" --max-time 10 --connect-timeout 5 2>/dev/null || echo "")
    
    if [[ -n "$response" ]] && echo "$response" | grep -q '"status":"ok"'; then
        success "$name API is healthy"
    else
        fail "$name API health check failed"
        echo "Response: $response"
        ((FAILED_CHECKS++))
    fi
}

echo "🔍 CarLedgr Health Check"
echo "======================="
echo ""

# Wait for services to stabilize
info "Waiting 5 seconds for services to stabilize..."
sleep 5
echo ""

# Check Demo Backend Service
check_service "carledgr-demo" "Demo Backend Service"

# Check Demo Backend API Health
check_api_health "https://demo-api.carledgr.com" "Demo Backend"

# Check Production Backend (only if it should be running)
if sudo systemctl is-active --quiet carledgr-prod; then
    info "Production backend detected, checking..."
    check_service "carledgr-prod" "Production Backend Service"
    check_api_health "https://api.carledgr.com" "Production Backend"
else
    info "Production backend not running (demo-only setup)"
fi

# Check website endpoints
check_endpoint "https://carledgr.com" "Marketing Website"
check_endpoint "https://demo.carledgr.com" "Demo Frontend"

# Check production frontend if backend is running
if sudo systemctl is-active --quiet carledgr-prod; then
    check_endpoint "https://app.carledgr.com" "Production Frontend"
fi

# Final result
echo ""
echo "=== HEALTH CHECK RESULTS ==="
echo "Total checks: $TOTAL_CHECKS"
echo "Failed checks: $FAILED_CHECKS"
echo ""

if [[ $FAILED_CHECKS -eq 0 ]]; then
    success "All health checks passed! ✅"
    echo ""
    echo "CarLedgr is healthy and running:"
    echo "  🌐 Marketing: https://carledgr.com"
    echo "  🧪 Demo: https://demo.carledgr.com"
    if sudo systemctl is-active --quiet carledgr-prod; then
        echo "  🚀 Production: https://app.carledgr.com"
    fi
    exit 0
else
    fail "Health check failed! ($FAILED_CHECKS failures)"
    echo ""
    echo "Please investigate the failures above."
    exit 1
fi