#!/bin/bash

# CarLedgr Smart Deployment Script
# Handles incremental deployments based on what changed

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

log "Starting smart deployment..."
info "Changes detected: Website=$WEBSITE_CHANGED, Frontend=$FRONTEND_CHANGED, Backend=$BACKEND_CHANGED, Caddy=$CADDY_CHANGED, Deploy Scripts=$DEPLOY_SCRIPTS_CHANGED"

# Check if we're in the right directory
if [[ ! -f "package.json" ]] && [[ ! -d "backend" ]]; then
    error "Not in CarLedgr project directory. Please run from /var/www/carledgr"
fi

# Function to check if service is running
is_service_running() {
    systemctl is-active --quiet "$1"
}

# Function to wait for service to be ready
wait_for_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    log "Waiting for $service to be ready..."
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "$service is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    error "$service failed to start properly after $max_attempts attempts"
}

# Pull latest code
log "Pulling latest code from repository..."
git fetch origin
git reset --hard origin/master
log "Code updated successfully"

# Deploy website if changed
if [[ "$WEBSITE_CHANGED" == "true" ]]; then
    log "Deploying website..."
    # Website files are already updated by git pull
    # No service restart needed for static files
    log "Website deployed successfully"
fi

# Deploy frontend if changed
if [[ "$FRONTEND_CHANGED" == "true" ]]; then
    log "Deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    log "Installing frontend dependencies..."
    npm ci --production=false
    
    # Build production frontend
    log "Building production frontend..."
    npm run build
    
    # Copy to demo environment
    log "Copying frontend build to demo environment..."
    cp -r dist/* /var/www/carledgr-demo/frontend/dist/
    
    cd ..
    log "Frontend deployed successfully"
fi

# Deploy backend if changed
if [[ "$BACKEND_CHANGED" == "true" ]]; then
    log "Deploying backend..."
    
    cd backend
    
    # Install dependencies for production
    log "Installing production backend dependencies..."
    npm ci --production
    
    # Copy to demo environment
    log "Copying backend to demo environment..."
    rsync -av --exclude=node_modules . /var/www/carledgr-demo/backend/
    
    # Install dependencies for demo
    cd /var/www/carledgr-demo/backend
    npm ci --production
    
    cd /var/www/carledgr
    
    # Restart services
    log "Restarting backend services..."
    
    # Restart demo backend
    systemctl restart carledgr-demo
    wait_for_service "carledgr-demo" "https://demo-api.carledgr.com"
    
    # Restart production backend if it's running
    if is_service_running carledgr-prod; then
        log "Restarting production backend..."
        systemctl restart carledgr-prod
        wait_for_service "carledgr-prod" "https://api.carledgr.com"
    else
        info "Production backend is not running, skipping restart"
    fi
    
    log "Backend deployed successfully"
fi

# Update deployment scripts if changed
if [[ "$DEPLOY_SCRIPTS_CHANGED" == "true" ]]; then
    log "Deployment scripts updated"
    # Make sure scripts are executable
    chmod +x server-deployment/*.sh
    log "Deployment scripts permissions updated"
fi

# Reload Caddy if config changed
if [[ "$CADDY_CHANGED" == "true" ]]; then
    log "Reloading Caddy configuration..."
    
    # Test Caddy configuration first
    if caddy validate --config ./server-deployment/Caddyfile; then
        cp ./server-deployment/Caddyfile /etc/caddy/
        systemctl reload caddy
        log "Caddy configuration reloaded successfully"
    else
        error "Invalid Caddy configuration, deployment aborted"
    fi
fi

# Health checks will be run separately by the CI/CD pipeline

log "🎉 Deployment completed successfully!"

# Log deployment info
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
echo "Access your applications:"
echo "  🌐 Website: https://carledgr.com"
echo "  🚀 Production: https://app.carledgr.com"
echo "  🧪 Demo: https://demo.carledgr.com" 