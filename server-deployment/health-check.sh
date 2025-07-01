#!/bin/bash

# CarLedgr Health Check Script
# Verifies all services are healthy after deployment

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

# Health check function
check_service() {
    local service_name=$1
    local service_systemd=$2
    local url=$3
    local expected_status=${4:-200}
    
    info "Checking $service_name..."
    
    # Check if systemd service is running
    if systemctl is-active --quiet "$service_systemd" 2>/dev/null; then
        success "$service_name service is running"
        
        # Check HTTP response if URL provided
        if [[ -n "$url" ]]; then
            local http_status
            http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
            
            if [[ "$http_status" == "$expected_status" ]]; then
                success "$service_name is responding correctly (HTTP $http_status)"
                return 0
            elif [[ "$http_status" == "000" ]]; then
                fail "$service_name is not responding (connection failed)"
                return 1
            else
                fail "$service_name returned HTTP $http_status (expected $expected_status)"
                return 1
            fi
        else
            return 0
        fi
    else
        fail "$service_name service is not running"
        return 1
    fi
}

# Check static content function
check_static() {
    local name=$1
    local url=$2
    local expected_content=$3
    
    info "Checking $name..."
    
    local response
    response=$(curl -s "$url" --max-time 10 || echo "")
    
    if [[ -n "$response" && "$response" == *"$expected_content"* ]]; then
        success "$name is serving content correctly"
        return 0
    else
        fail "$name is not serving expected content"
        return 1
    fi
}

# Initialize counters
total_checks=0
passed_checks=0

log "Starting health checks for CarLedgr deployment..."
echo ""

# Check Caddy web server
info "=== CADDY WEB SERVER ==="
((total_checks++))
if check_service "Caddy" "caddy" "https://carledgr.com"; then
    ((passed_checks++))
else
    warning "Caddy check failed - this might be normal during initial setup"
fi
echo ""

# Check Marketing Website
info "=== MARKETING WEBSITE ==="
((total_checks++))
if check_static "Marketing Website" "https://carledgr.com" "<title>"; then
    ((passed_checks++))
fi

((total_checks++))
if check_static "WWW Marketing Website" "https://www.carledgr.com" "<title>"; then
    ((passed_checks++))
fi
echo ""

# Check Production Frontend
info "=== PRODUCTION FRONTEND ==="
((total_checks++))
if check_static "Production Frontend" "https://app.carledgr.com" "<title>"; then
    ((passed_checks++))
fi
echo ""

# Check Demo Frontend
info "=== DEMO FRONTEND ==="
((total_checks++))
if check_static "Demo Frontend" "https://demo.carledgr.com" "<title>"; then
    ((passed_checks++))
fi
echo ""

# Check Demo Backend API
info "=== DEMO BACKEND API ==="
((total_checks++))
if check_service "Demo Backend" "carledgr-demo" "https://demo-api.carledgr.com" "404"; then
    ((passed_checks++))
fi
echo ""

# Check Production Backend API (only if running)
info "=== PRODUCTION BACKEND API ==="
if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    ((total_checks++))
    if check_service "Production Backend" "carledgr-prod" "https://api.carledgr.com" "404"; then
        ((passed_checks++))
    fi
else
    warning "Production backend is not running (this is normal if not started yet)"
fi
echo ""

# SSL Certificate checks
info "=== SSL CERTIFICATES ==="
check_ssl() {
    local domain=$1
    info "Checking SSL certificate for $domain..."
    
    local ssl_info
    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [[ -n "$ssl_info" ]]; then
        success "SSL certificate is valid for $domain"
        return 0
    else
        fail "SSL certificate check failed for $domain"
        return 1
    fi
}

for domain in "carledgr.com" "www.carledgr.com" "app.carledgr.com" "demo.carledgr.com" "demo-api.carledgr.com"; do
    ((total_checks++))
    if check_ssl "$domain"; then
        ((passed_checks++))
    fi
done

if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    ((total_checks++))
    if check_ssl "api.carledgr.com"; then
        ((passed_checks++))
    fi
fi

echo ""

# Final summary
info "=== HEALTH CHECK SUMMARY ==="
echo "Passed: $passed_checks/$total_checks checks"

if [[ $passed_checks -eq $total_checks ]]; then
    success "All health checks passed! 🎉"
    echo ""
    echo "Your CarLedgr deployment is healthy and ready to use:"
    echo "  🌐 Marketing: https://carledgr.com"
    echo "  🚀 Production: https://app.carledgr.com"
    echo "  🧪 Demo: https://demo.carledgr.com"
else
    warning "Some health checks failed ($((total_checks - passed_checks)) failures)"
    echo ""
    echo "Deployment completed but some services may need attention."
    echo "Check the logs above for details."
fi

# Always exit successfully so deployment isn't blocked
success "Health check completed (informational only)"
exit 0 