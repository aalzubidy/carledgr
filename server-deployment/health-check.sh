#!/bin/bash

# CarLedgr Health Check Script
# Critical checks will fail deployment, non-critical are informational

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

fail() {
    echo -e "${RED}❌${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check systemd service
check_service() {
    local service_name=$1
    local display_name=$2
    
    info "Checking $display_name service..."
    
    if systemctl is-active --quiet "$service_name" 2>/dev/null; then
        success "$display_name is running"
        return 0
    else
        fail "$display_name is not running"
        systemctl status "$service_name" --no-pager -l || true
        return 1
    fi
}

# Check API health endpoint
check_api_health() {
    local url=$1
    local name=$2
    
    info "Checking $name API health..."
    
    local response
    response=$(curl -s "$url/health" --max-time 10 --connect-timeout 5 || echo "CURL_ERROR")
    
    if [[ -n "$response" ]] && [[ "$response" != "CURL_ERROR" ]] && echo "$response" | grep -q '"status":"ok"'; then
        success "$name API is healthy"
        return 0
    else
        fail "$name API health check failed"
        echo "Response: $response"
        return 1
    fi
}

# Check website content
check_website() {
    local url=$1
    local name=$2
    
    info "Checking $name content..."
    
    local response
    response=$(curl -s "$url" --max-time 10 --connect-timeout 5 || echo "CURL_ERROR")
    
    if [[ -n "$response" ]] && [[ "$response" != "CURL_ERROR" ]] && [[ ${#response} -gt 100 ]]; then
        success "$name is serving content"
        return 0
    else
        fail "$name is not serving content properly"
        echo "Response length: ${#response}"
        return 1
    fi
}

# Initialize counters
critical_checks=0
critical_passed=0

log "Starting CarLedgr health checks..."
echo ""

info "Waiting 5 seconds for services to stabilize..."
sleep 5
echo ""

info "=== CRITICAL CHECKS ==="

# Check Demo Backend Service
((critical_checks++))
if check_service "carledgr-demo" "Demo Backend Service"; then
    ((critical_passed++))
fi

# Check Demo Backend API Health
((critical_checks++))
if check_api_health "https://demo-api.carledgr.com" "Demo Backend"; then
    ((critical_passed++))
fi

# Check Production Backend (only if running)
if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    info "Production backend detected, checking..."
    
    ((critical_checks++))
    if check_service "carledgr-prod" "Production Backend Service"; then
        ((critical_passed++))
    fi
    
    ((critical_checks++))
    if check_api_health "https://api.carledgr.com" "Production Backend"; then
        ((critical_passed++))
    fi
else
    info "Production backend not running (demo-only setup)"
fi

echo ""
info "=== BASIC CONNECTIVITY ==="

# Check websites are serving content
check_website "https://carledgr.com" "Marketing Website"
check_website "https://demo.carledgr.com" "Demo Frontend"

# Check production frontend if backend is running
if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    check_website "https://app.carledgr.com" "Production Frontend"
fi

echo ""
info "=== SUMMARY ==="
echo "Critical checks: $critical_passed/$critical_checks"

# Final result
if [[ $critical_passed -eq $critical_checks ]]; then
    success "All critical checks passed! Deployment is healthy ✅"
    echo ""
    echo "CarLedgr is running:"
    echo "  🌐 Marketing: https://carledgr.com"
    echo "  🧪 Demo: https://demo.carledgr.com"
    if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
        echo "  🚀 Production: https://app.carledgr.com"
    fi
    exit 0
else
    fail "CRITICAL CHECKS FAILED! ($((critical_checks - critical_passed)) failures)"
    echo ""
    echo "Deployment failed. Check the errors above."
    exit 1
fi