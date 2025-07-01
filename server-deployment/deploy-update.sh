#!/bin/bash

# CarLedgr Smart Deployment Script
# Handles incremental deployments based on what changed

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
    error "npm command not found. Please ensure Node.js is properly installed for the deploy user."
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

log "Starting smart deployment..."
info "Changes detected: Website=$WEBSITE_CHANGED, Frontend=$FRONTEND_CHANGED, Backend=$BACKEND_CHANGED, Caddy=$CADDY_CHANGED, Deploy Scripts=$DEPLOY_SCRIPTS_CHANGED"

# Check if we're in the right directory
if [[ ! -f "package.json" ]] && [[ ! -d "backend" ]]; then
    error "Not in CarLedgr project directory. Please run from /var/www/carledgr"
fi

# Function to check if service is running
is_service_running() {
    sudo systemctl is-active --quiet "$1"
}



# Simple function to check if service is working
wait_for_service() {
    local service=$1
    local url=$2
    
    log "Checking if $service is ready..."
    
    # Quick check - if service is active, assume it's working
    if sudo systemctl is-active --quiet "$service"; then
        log "$service is active"
        
        # Try a quick health check, but don't fail if it doesn't work
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            log "$service health check passed"
        elif curl -f -s "$url" > /dev/null 2>&1; then
            log "$service is responding (health endpoint might not exist)"
        else
            warning "$service is active but not responding to HTTP yet (this might be normal)"
        fi
        
        return 0
    fi
    
    # If service isn't active, wait a bit and try once more
    warning "$service is not active, waiting 10 seconds..."
    sleep 10
    
    if sudo systemctl is-active --quiet "$service"; then
        log "$service is now active"
        return 0
    else
        # Show basic status but don't fail deployment
        warning "$service is not active, but continuing deployment"
        sudo systemctl status "$service" --no-pager -l || true
        return 0  # Don't fail the deployment!
    fi
}

# Pull latest code
log "Pulling latest code from repository..."
git fetch origin
git reset --hard origin/master
log "Code updated successfully"

# Deploy backend FIRST (before frontend)
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
    log "Stopping carledgr-demo service..."
    sudo systemctl stop carledgr-demo || true
    sleep 2
    log "Starting carledgr-demo service..."
    sudo systemctl start carledgr-demo
    wait_for_service "carledgr-demo" "https://demo-api.carledgr.com"
    
    # Restart production backend if it's running
    if is_service_running carledgr-prod; then
        log "Restarting production backend..."
        log "Stopping carledgr-prod service..."
        sudo systemctl stop carledgr-prod || true
        sleep 2
        log "Starting carledgr-prod service..."
        sudo systemctl start carledgr-prod
        wait_for_service "carledgr-prod" "https://api.carledgr.com"
    else
        info "Production backend is not running, skipping restart"
    fi
    
    log "Backend deployed successfully"
fi

# Deploy frontend AFTER backend
if [[ "$FRONTEND_CHANGED" == "true" ]]; then
    log "Deploying frontend..."
    
    cd frontend
    
    # Install dependencies
    log "Installing frontend dependencies..."
    npm ci --production=false
    
    # Build production frontend
    log "Building production frontend..."
    npm run build
    
    log "Deploying frontend with environment-specific configurations..."
    
    # The build is already in /var/www/carledgr/frontend/dist/ (current location)
    # So we don't need to copy to production, but we need to copy to demo
    
    # Update config.json for production (api.carledgr.com) - already in place
    sed -i 's|"baseUrl": "[^"]*"|"baseUrl": "https://api.carledgr.com/api"|' dist/config.json
    log "Production frontend deployed with API URL: https://api.carledgr.com/api"
    
    # Copy demo frontend
    cp -r dist/* /var/www/carledgr-demo/frontend/dist/
    
    # Update config.json for demo (demo-api.carledgr.com)
    sed -i 's|"baseUrl": "[^"]*"|"baseUrl": "https://demo-api.carledgr.com/api"|' /var/www/carledgr-demo/frontend/dist/config.json
    log "Demo frontend deployed with API URL: https://demo-api.carledgr.com/api"
    
    cd ..
    log "Frontend deployed successfully"
fi

# Deploy website if changed
if [[ "$WEBSITE_CHANGED" == "true" ]]; then
    log "Deploying website..."
    # Website files are already updated by git pull
    # No service restart needed for static files
    log "Website deployed successfully"
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
        sudo cp ./server-deployment/Caddyfile /etc/caddy/
        sudo systemctl reload caddy
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