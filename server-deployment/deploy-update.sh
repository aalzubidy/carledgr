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

# Function to check and fix backend setup
check_and_fix_backend_setup() {
    local env_name=$1
    local backend_path="/var/www/carledgr${env_name:+-$env_name}/backend"
    local config_path="/etc/carledgr${env_name:+-$env_name}/config.json"
    
    log "Checking ${env_name:-production} backend setup..."
    
    # Check configuration file
    if [[ ! -f "$config_path" ]]; then
        error "Configuration file not found: $config_path"
    fi
    
    if ! jq empty "$config_path" 2>/dev/null; then
        error "Invalid JSON in configuration file: $config_path"
    fi
    
    # Check backend directory and dependencies
    if [[ ! -d "$backend_path" ]]; then
        error "Backend directory not found: $backend_path"
    fi
    
    cd "$backend_path"
    
    if [[ ! -f "package.json" ]]; then
        error "package.json not found in $backend_path"
    fi
    
    # Check and fix node_modules
    if [[ ! -d "node_modules" ]] || [[ ! -d "node_modules/express" ]]; then
        warning "Missing or incomplete node_modules, reinstalling..."
        npm ci --production
    fi
    
    # Test manual startup to catch startup errors
    log "Testing ${env_name:-production} backend startup..."
    export NODE_ENV=production
    export CL_BACKEND_CONFIG_FILE="$config_path"
    
    # Capture startup output
    local startup_output
    startup_output=$(timeout 10s node index.js 2>&1 || echo "STARTUP_FAILED")
    
    if echo "$startup_output" | grep -q "STARTUP_FAILED\|Error\|error\|ERROR"; then
        error "Backend startup test failed for ${env_name:-production}:
$startup_output"
    fi
    
    if echo "$startup_output" | grep -q "Server running\|listening\|started"; then
        info "Backend startup test passed for ${env_name:-production}"
    else
        warning "Backend startup test unclear for ${env_name:-production}. Output:
$startup_output"
    fi
    
    cd /var/www/carledgr
}

# Function to wait for service to be ready with automatic diagnosis
wait_for_service() {
    local service=$1
    local url=$2
    local max_systemd_attempts=15
    local max_http_attempts=20
    local attempt=1
    
    log "Waiting for $service to be ready..."
    
    # First wait for systemd service to be active
    while [[ $attempt -le $max_systemd_attempts ]]; do
        if sudo systemctl is-active --quiet "$service"; then
            log "$service systemd service is active"
            break
        elif [[ $attempt -eq $max_systemd_attempts ]]; then
            # Service failed to start - provide diagnosis and try to fix
            warning "$service systemd service failed to start within $max_systemd_attempts attempts"
            
            info "Service status:"
            sudo systemctl status "$service" --no-pager -l || true
            
            info "Recent logs:"
            local logs
            logs=$(sudo journalctl -u "$service" --no-pager -l -n 20 2>/dev/null || echo "No logs available")
            echo "$logs"
            
            # Try to identify and fix common issues
            if echo "$logs" | grep -q "ENOENT\|Cannot find module\|MODULE_NOT_FOUND"; then
                warning "Dependencies issue detected. Reinstalling node_modules..."
                local backend_path="/var/www/carledgr${service#carledgr}-demo/backend"
                if [[ "$service" == "carledgr-prod" ]]; then
                    backend_path="/var/www/carledgr/backend"
                fi
                cd "$backend_path"
                rm -rf node_modules package-lock.json
                npm install --production
                cd /var/www/carledgr
                
                log "Retrying service start after dependency fix..."
                sudo systemctl start "$service"
                sleep 5
                
                if sudo systemctl is-active --quiet "$service"; then
                    log "$service started successfully after dependency fix"
                    break
                fi
            fi
            
            if echo "$logs" | grep -q "permission denied\|EACCES"; then
                warning "Permission issue detected. Fixing permissions..."
                local base_path="/var/www/carledgr"
                if [[ "$service" == "carledgr-demo" ]]; then
                    base_path="/var/www/carledgr-demo"
                fi
                sudo chown -R deploy:deploy "$base_path"
                sudo chmod -R 755 "$base_path"
                
                log "Retrying service start after permission fix..."
                sudo systemctl start "$service"
                sleep 5
                
                if sudo systemctl is-active --quiet "$service"; then
                    log "$service started successfully after permission fix"
                    break
                fi
            fi
            
            if echo "$logs" | grep -q "port.*already in use\|EADDRINUSE"; then
                warning "Port conflict detected. Checking for conflicting processes..."
                local port="3001"
                if [[ "$service" == "carledgr-prod" ]]; then
                    port="3000"
                fi
                
                local conflicting_pid
                conflicting_pid=$(sudo lsof -t -i:"$port" 2>/dev/null || echo "")
                if [[ -n "$conflicting_pid" ]]; then
                    warning "Killing conflicting process on port $port (PID: $conflicting_pid)"
                    sudo kill -9 "$conflicting_pid" 2>/dev/null || true
                    sleep 2
                    
                    log "Retrying service start after port cleanup..."
                    sudo systemctl start "$service"
                    sleep 5
                    
                    if sudo systemctl is-active --quiet "$service"; then
                        log "$service started successfully after port cleanup"
                        break
                    fi
                fi
            fi
            
            error "$service systemd service failed to start and automatic fixes didn't work. Manual intervention required."
        fi
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    # Then wait for HTTP endpoint to be ready
    attempt=1
    while [[ $attempt -le $max_http_attempts ]]; do
        if curl -f -s "$url/health" > /dev/null 2>&1; then
            log "$service is ready and responding!"
            return 0
        fi
        echo -n "."
        sleep 3
        ((attempt++))
    done
    
    # HTTP endpoint still not responding
    warning "$service HTTP endpoint not responding after $max_http_attempts attempts"
    warning "Service is running but not responding to HTTP requests"
    
    # Check if it's a network/firewall issue
    if curl -f -s "$url" > /dev/null 2>&1; then
        warning "Base URL responds but /health endpoint doesn't. This might be a backend routing issue."
    else
        warning "No HTTP response at all. This might be a network or firewall issue."
    fi
    
    info "Final service status:"
    sudo systemctl status "$service" --no-pager -l || true
    
    error "$service failed to become fully ready. Manual investigation required."
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
    
    # Check and fix backend setups
    check_and_fix_backend_setup "demo"
    
    # Check production setup only if service is supposed to be running
    if is_service_running carledgr-prod; then
        check_and_fix_backend_setup ""
    fi
    
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