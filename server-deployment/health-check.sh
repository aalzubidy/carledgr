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

# Health check function
check_service() {
    local service_name=$1
    local service_systemd=$2
    local url=$3
    local expected_status=${4:-200}
    local is_critical=${5:-false}
    
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
                if [[ "$is_critical" == "true" ]]; then
                    fail "$service_name is not responding (connection failed) - CRITICAL"
                else
                    warning "$service_name is not responding (connection failed)"
                fi
                return 1
            else
                if [[ "$is_critical" == "true" ]]; then
                    fail "$service_name returned HTTP $http_status (expected $expected_status) - CRITICAL"
                else
                    warning "$service_name returned HTTP $http_status (expected $expected_status)"
                fi
                return 1
            fi
        else
            return 0
        fi
    else
        if [[ "$is_critical" == "true" ]]; then
            fail "$service_name service is not running - CRITICAL"
        else
            warning "$service_name service is not running"
        fi
        return 1
    fi
}

# Check static content function
check_static() {
    local name=$1
    local url=$2
    local expected_content=$3
    local is_critical=${4:-false}
    
    info "Checking $name..."
    
    local response
    response=$(curl -s "$url" --max-time 10 || echo "")
    
    if [[ -n "$response" && "$response" == *"$expected_content"* ]]; then
        success "$name is serving content correctly"
        return 0
    else
        if [[ "$is_critical" == "true" ]]; then
            fail "$name is not serving expected content - CRITICAL"
        else
            warning "$name is not serving expected content"
        fi
        return 1
    fi
}

# Initialize counters
total_checks=0
passed_checks=0
critical_checks=0
critical_passed=0

log "Starting health checks for CarLedgr deployment..."
echo ""

# CRITICAL CHECKS - These will fail deployment if they fail
info "=== CRITICAL CHECKS ==="

# Check Demo Backend (critical - core service)
((total_checks++))
((critical_checks++))
if check_service "Demo Backend" "carledgr-demo" "https://demo-api.carledgr.com" "404" "true"; then
    ((passed_checks++))
    ((critical_passed++))
fi

# Check Production Backend (critical if running)
if systemctl is-active --quiet carledgr-prod 2>/dev/null; then
    ((total_checks++))
    ((critical_checks++))
    if check_service "Production Backend" "carledgr-prod" "https://api.carledgr.com" "404" "true"; then
        ((passed_checks++))
        ((critical_passed++))
    fi
fi

echo ""

# NON-CRITICAL CHECKS - These are informational only
info "=== NON-CRITICAL CHECKS (Informational) ==="

# Check Caddy web server (non-critical - might have SSL timing issues)
((total_checks++))
if check_service "Caddy" "caddy" "https://carledgr.com" "200" "false"; then
    ((passed_checks++))
fi

# Check Marketing Website
((total_checks++))
if check_static "Marketing Website" "https://carledgr.com" "<title>" "false"; then
    ((passed_checks++))
fi

((total_checks++))
if check_static "WWW Marketing Website" "https://www.carledgr.com" "<title>" "false"; then
    ((passed_checks++))
fi

# Check Production Frontend
((total_checks++))
if check_static "Production Frontend" "https://app.carledgr.com" "<title>" "false"; then
    ((passed_checks++))
fi

# Check Demo Frontend
((total_checks++))
if check_static "Demo Frontend" "https://demo.carledgr.com" "<title>" "false"; then
    ((passed_checks++))
fi

# SSL Certificate checks (non-critical)
info "=== SSL CERTIFICATES (Non-Critical) ==="
check_ssl() {
    local domain=$1
    info "Checking SSL certificate for $domain..."
    
    local ssl_info
    ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [[ -n "$ssl_info" ]]; then
        success "SSL certificate is valid for $domain"
        return 0
    else
        warning "SSL certificate check failed for $domain"
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