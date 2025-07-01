#!/bin/bash

# CarLedgr Health Check Script
# Verifies all services are healthy after deployment
# Critical checks will fail deployment, non-critical are informational

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

fail() {
    echo -e "${RED}❌ $1${NC}"
}

# Check systemd service status
check_systemd_service() {
    local service_name=$1
    local display_name=$2
    
    info "Checking $display_name service status..."
    
    if systemctl is-active --quiet "$service_name" 2>/dev/null; then
        success "$display_name service is running"
        return 0
    else
        fail "$display_name service is not running"
        echo "--- Service status for $service_name ---"
        systemctl status "$service_name" --no-pager -l || true
        echo "--- End service status ---"
        return 1
    fi
}

# Check basic HTTP connectivity
check_http_basic() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    info "Checking $name HTTP connectivity..."
    
    local http_status
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 --connect-timeout 5 || echo "000")
    
    if [[ "$http_status" == "$expected_status" ]]; then
        success "$name is responding (HTTP $http_status)"
        return 0
    elif [[ "$http_status" == "000" ]]; then
        fail "$name is not responding (connection failed)"
        echo "--- Curl debug for $url ---"
        curl -v "$url" --max-time 10 --connect-timeout 5 || true
        echo "--- End curl debug ---"
        return 1
    else
        fail "$name returned HTTP $http_status (expected $expected_status)"
        return 1
    fi
}

# Check backend API health endpoint
check_api_health() {
    local url=$1
    local name=$2
    
    info "Checking $name API health..."
    
    local response
    response=$(curl -s "$url/health" --max-time 10 --connect-timeout 5 || echo "CURL_ERROR")
    
    echo "--- API Response for $url ---"
    echo "Response: $response"
    echo "--- End API Response ---"
    
    if [[ -n "$response" ]] && [[ "$response" != "CURL_ERROR" ]] && echo "$response" | grep -q '"status":"ok"'; then
        success "$name API is healthy"
        return 0
    else
        fail "$name API health check failed"
        echo "Full curl debug:"
        curl -v "$url/health" --max-time 10 --connect-timeout 5 || true
        return 1
    fi
}

# Initialize counters
critical_checks=0
critical_passed=0
total_checks=0
passed_checks=0

log "Starting health checks for CarLedgr deployment..."
echo ""

# Wait a moment for services to fully start
info "Waiting 5 seconds for services to stabilize..."
sleep 5
echo ""

# CRITICAL CHECKS - These will fail deployment if they fail
info "=== CRITICAL CHECKS ==="

# Check Demo Backend Service
info "Starting Demo Backend Service check..."
((total_checks++))
((critical_checks++))
if check_systemd_service "carledgr-demo" "Demo Backend"; then
    ((passed_checks++))
    ((critical_passed++))
    info "Demo Backend Service check PASSED"
else
    info "Demo Backend Service check FAILED"
fi

# Check Demo Backend API Health
info "Starting Demo Backend API Health check..."
((total_checks++))
((critical_checks++))
if check_api_health "https://demo-api.carledgr.com" "Demo Backend"; then
    ((passed_checks++))
    ((critical_passed++))
    info "Demo Backend API Health check PASSED"
else
    info "Demo Backend API Health check FAILED"
fi

# Check Production Backend (only if running)
if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    info "Production backend is running, checking health..."
    
    ((total_checks++))
    ((critical_checks++))
    if check_systemd_service "carledgr-prod" "Production Backend"; then
        ((passed_checks++))
        ((critical_passed++))
    fi
    
    ((total_checks++))
    ((critical_checks++))
    if check_api_health "https://api.carledgr.com" "Production Backend"; then
        ((passed_checks++))
        ((critical_passed++))
    fi
else
    info "Production backend is not running (this is normal for demo-only setups)"
fi

echo ""

# NON-CRITICAL CHECKS - These are informational only
info "=== NON-CRITICAL CHECKS (Informational) ==="

# Check Caddy service
((total_checks++))
if check_systemd_service "caddy" "Caddy Web Server"; then
    ((passed_checks++))
fi

# Check basic website connectivity
((total_checks++))
if check_http_basic "https://carledgr.com" "Marketing Website"; then
    ((passed_checks++))
fi

((total_checks++))
if check_http_basic "https://www.carledgr.com" "WWW Marketing Website"; then
    ((passed_checks++))
fi

((total_checks++))
if check_http_basic "https://app.carledgr.com" "Production Frontend"; then
    ((passed_checks++))
fi

((total_checks++))
if check_http_basic "https://demo.carledgr.com" "Demo Frontend"; then
    ((passed_checks++))
fi

# Quick SSL check (just verify HTTPS works)
info "=== SSL CONNECTIVITY (Non-Critical) ==="
for domain in "carledgr.com" "demo.carledgr.com" "demo-api.carledgr.com"; do
    ((total_checks++))
    if check_http_basic "https://$domain" "SSL for $domain"; then
        ((passed_checks++))
    fi
done

# Check production SSL if service is running
if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    for domain in "app.carledgr.com" "api.carledgr.com"; do
        ((total_checks++))
        if check_http_basic "https://$domain" "SSL for $domain"; then
            ((passed_checks++))
        fi
    done
fi

echo ""

# Final summary
info "=== HEALTH CHECK SUMMARY ==="
echo "Critical checks: $critical_passed/$critical_checks (must all pass)"
echo "All checks: $passed_checks/$total_checks"

# Check critical services
if [[ $critical_passed -eq $critical_checks ]]; then
    success "All critical checks passed! ✅"
    
    if [[ $passed_checks -eq $total_checks ]]; then
        success "All health checks passed! 🎉"
        echo ""
        echo "Your CarLedgr deployment is fully healthy:"
        echo "  🌐 Marketing: https://carledgr.com"
        echo "  🚀 Production: https://app.carledgr.com"
        echo "  🧪 Demo: https://demo.carledgr.com"
    else
        warning "Some non-critical checks failed ($((total_checks - passed_checks)) failures)"
        echo ""
        echo "Deployment is healthy but some services may need attention."
        echo "Check the logs above for details."
    fi
    
    exit 0
else
    fail "CRITICAL CHECKS FAILED! ($((critical_checks - critical_passed)) failures)"
    echo ""
    echo "Deployment failed due to critical service issues."
    echo "Please fix the critical issues above before proceeding."
    exit 1
fi 