#!/bin/bash

# CarLedgr Simple Deployment Script
# Deploy backend, frontend, and website based on what changed

set -e

# Set up Node.js environment for deploy user
export NVM_DIR="/home/deploy/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the current/default node version from nvm
if command -v nvm >/dev/null 2>&1; then
    nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1
fi

# Fallback: add common Node.js paths
export PATH="/home/deploy/.nvm/versions/node/v22.17.0/bin:/home/deploy/.nvm/versions/node/v20.17.0/bin:/home/deploy/.nvm/versions/node/v18.20.4/bin:$PATH"

# Verify npm is available
if ! command -v npm >/dev/null 2>&1; then
    echo "ERROR: npm command not found. Please ensure Node.js is properly installed for the deploy user."
    exit 1
fi

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
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Default values
WEBSITE_CHANGED=false
FRONTEND_CHANGED=false
BACKEND_CHANGED=false
CADDY_CHANGED=false
DEPLOY_SCRIPTS_CHANGED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --website=*) WEBSITE_CHANGED="${1#*=}"; shift ;;
    --frontend=*) FRONTEND_CHANGED="${1#*=}"; shift ;;
    --backend=*) BACKEND_CHANGED="${1#*=}"; shift ;;
    --caddy=*) CADDY_CHANGED="${1#*=}"; shift ;;
    --deploy-scripts=*) DEPLOY_SCRIPTS_CHANGED="${1#*=}"; shift ;;
    *) shift ;;
  esac
done

log "Starting deployment..."
info "Changes detected: Website=$WEBSITE_CHANGED, Frontend=$FRONTEND_CHANGED, Backend=$BACKEND_CHANGED, Caddy=$CADDY_CHANGED, Deploy Scripts=$DEPLOY_SCRIPTS_CHANGED"

# Check if we're in the right directory
if [[ ! -f "package.json" ]] && [[ ! -d "backend" ]]; then
    error "Not in CarLedgr project directory. Please run from /var/www/carledgr"
fi

# Pull latest code with self-update detection
log "Pulling latest code from repository..."
SCRIPT_BEFORE=$(md5sum "$0" 2>/dev/null || echo "")
git fetch origin
git reset --hard origin/master
log "Code updated successfully"

# Check if this script was updated and re-exec if needed
SCRIPT_AFTER=$(md5sum "$0" 2>/dev/null || echo "")
if [[ "$SCRIPT_BEFORE" != "$SCRIPT_AFTER" ]] && [[ -n "$SCRIPT_BEFORE" ]]; then
    log "Deployment script was updated, re-executing with new version..."
    exec "$0" "$@"
fi

# Function to check if service is running
is_service_running() {
    sudo systemctl is-active --quiet "$1"
}

# Simple service check - don't fail deployment
check_service() {
    local service=$1
    if sudo systemctl is-active --quiet "$service"; then
        log "$service is running"
    else
        warning "$service is not running (will be checked by health script)"
    fi
}

# BACKEND DEPLOYMENT (first)
if [[ "$BACKEND_CHANGED" == "true" ]]; then
    log "Deploying backend..."
    
    # Install dependencies for production backend
    cd backend
    log "Installing production backend dependencies..."
    npm ci --production
    
    # Copy to demo environment
    log "Copying backend to demo environment..."
    rsync -av --exclude=node_modules . /var/www/carledgr-demo/backend/
    
    # Install dependencies for demo backend
    cd /var/www/carledgr-demo/backend
    log "Installing demo backend dependencies..."
    npm ci --production
    
    cd /var/www/carledgr
    
    # Restart backend services
    log "Restarting backend services..."
    
    # Always restart demo
    log "Restarting carledgr-demo service..."
    sudo systemctl restart carledgr-demo
    check_service "carledgr-demo"
    
    # Restart production if it's supposed to be running
    if is_service_running carledgr-prod; then
        log "Restarting carledgr-prod service..."
        sudo systemctl restart carledgr-prod
        check_service "carledgr-prod"
    else
        info "Production backend is not running, skipping restart"
    fi
    
    log "Backend deployed successfully"
fi

# FRONTEND DEPLOYMENT (after backend)
if [[ "$FRONTEND_CHANGED" == "true" ]]; then
    log "Deploying frontend..."
    
    cd frontend
    
    # Install dependencies and build
    log "Installing frontend dependencies..."
    npm ci --production=false
    
    log "Building production frontend..."
    npm run build
    
    log "Configuring frontend environments..."
    
    # Configure production frontend (already in place at dist/)
    sed -i 's|"baseUrl": "[^"]*"|"baseUrl": "https://api.carledgr.com/api"|' dist/config.json
    log "Production frontend configured with API URL: https://api.carledgr.com/api"
    
    # Copy and configure demo frontend
    cp -r dist/* /var/www/carledgr-demo/frontend/dist/
    sed -i 's|"baseUrl": "[^"]*"|"baseUrl": "https://demo-api.carledgr.com/api"|' /var/www/carledgr-demo/frontend/dist/config.json
    log "Demo frontend configured with API URL: https://demo-api.carledgr.com/api"
    
    cd /var/www/carledgr
    log "Frontend deployed successfully"
fi

# WEBSITE DEPLOYMENT
if [[ "$WEBSITE_CHANGED" == "true" ]]; then
    log "Deploying website..."
    # Website files are already updated by git pull - no additional steps needed
    log "Website deployed successfully"
fi

# UPDATE DEPLOYMENT SCRIPTS
if [[ "$DEPLOY_SCRIPTS_CHANGED" == "true" ]]; then
    log "Updating deployment scripts..."
    chmod +x server-deployment/*.sh
    log "Deployment scripts updated successfully"
fi

# CADDY CONFIGURATION
if [[ "$CADDY_CHANGED" == "true" ]]; then
    log "Updating Caddy configuration..."
    
    # Test configuration first
    if caddy validate --config ./server-deployment/Caddyfile; then
        sudo cp /var/www/carledgr/server-deployment/Caddyfile /etc/caddy/Caddyfile
        sudo systemctl reload caddy
        log "Caddy configuration updated successfully"
    else
        error "Invalid Caddy configuration, deployment aborted"
    fi
fi

log "🎉 Deployment completed successfully!"

# Summary
echo ""
info "=== DEPLOYMENT SUMMARY ==="
echo "Timestamp: $(date)"
echo "Git commit: $(git rev-parse HEAD)"
echo "Components deployed:"
[[ "$WEBSITE_CHANGED" == "true" ]] && echo "  ✅ Website"
[[ "$FRONTEND_CHANGED" == "true" ]] && echo "  ✅ Frontend"
[[ "$BACKEND_CHANGED" == "true" ]] && echo "  ✅ Backend"
[[ "$CADDY_CHANGED" == "true" ]] && echo "  ✅ Caddy"
[[ "$DEPLOY_SCRIPTS_CHANGED" == "true" ]] && echo "  ✅ Deploy Scripts"
echo ""
echo "Next: Run health checks to verify everything is working"
echo "Access your applications:"
echo "  🌐 Website: https://carledgr.com"
echo "  🚀 Production: https://app.carledgr.com"
echo "  🧪 Demo: https://demo.carledgr.com" 