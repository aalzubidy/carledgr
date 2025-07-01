#!/bin/bash

# CarLedgr Automated Deployment Script
# This script sets up a complete CarLedgr deployment on a fresh Ubuntu 24.04 VPS
# Run as root or with sudo privileges

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    warning "Running as root. This is acceptable but not recommended."
fi

# Configuration variables
DEPLOY_USER="deploy"
DEPLOY_PASSWORD="xxxx"
NODE_VERSION="22.17.0"
REPO_URL="https://github.com/your-username/carledgr.git"  # Update this with your actual repo
VPS_IP=$(curl -s ifconfig.me)

log "Starting CarLedgr deployment on IP: $VPS_IP"

# Step 1: System Update and Package Installation
log "Step 1: Updating system and installing packages..."
apt update && apt upgrade -y

# Install required packages
apt install -y curl wget git unzip caddy ufw sshpass

# Remove nginx if installed (we use Caddy)
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    systemctl disable nginx
    apt remove -y nginx nginx-common nginx-light nginx-full 2>/dev/null || true
fi

log "System packages installed successfully"

# Step 2: User Management
log "Step 2: Setting up users..."

# Create deploy user if doesn't exist
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash $DEPLOY_USER
    echo "$DEPLOY_USER:$DEPLOY_PASSWORD" | chpasswd
    usermod -aG sudo $DEPLOY_USER
    log "Created deploy user"
else
    log "Deploy user already exists"
fi

# Add deploy user to caddy group (caddy group created when caddy was installed)
usermod -a -G caddy $DEPLOY_USER

log "User management completed"

# Step 3: Directory Structure
log "Step 3: Creating directory structure..."

# Create application directories
mkdir -p /var/www/{carledgr,carledgr-demo}/{backend,frontend,website}
mkdir -p /var/log/{carledgr,carledgr-demo}
mkdir -p /etc/{carledgr,carledgr-demo}

# Set ownership and permissions
chown -R $DEPLOY_USER:$DEPLOY_USER /var/www/carledgr /var/www/carledgr-demo
chown -R caddy:caddy /var/log/carledgr /var/log/carledgr-demo
chmod -R 775 /var/log/carledgr /var/log/carledgr-demo
chown -R $DEPLOY_USER:$DEPLOY_USER /etc/carledgr /etc/carledgr-demo

log "Directory structure created"

# Step 4: Node.js Installation via nvm
log "Step 4: Installing Node.js via nvm..."

# Install nvm for deploy user
sudo -u $DEPLOY_USER bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash'

# Install Node.js
sudo -u $DEPLOY_USER bash -c "source ~/.nvm/nvm.sh && nvm install $NODE_VERSION && nvm use $NODE_VERSION && nvm alias default $NODE_VERSION"

log "Node.js $NODE_VERSION installed successfully"

# Step 5: Repository Cloning and Application Setup
log "Step 5: Cloning repository and setting up applications..."

# Note: This assumes the current directory contains the CarLedgr project
# If running from a different location, update the paths accordingly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_DIR/package.json" ] && [ ! -f "$PROJECT_DIR/backend/package.json" ]; then
    error "CarLedgr project files not found. Please run this script from the CarLedgr project directory."
fi

# Copy project files to production directory
log "Copying project files to production directory..."
sudo -u $DEPLOY_USER cp -r "$PROJECT_DIR"/* /var/www/carledgr/
sudo -u $DEPLOY_USER cp -r "$PROJECT_DIR"/* /var/www/carledgr-demo/

# Install dependencies and build
log "Installing dependencies for production backend..."
cd /var/www/carledgr/backend
sudo -u $DEPLOY_USER bash -c 'source ~/.nvm/nvm.sh && npm install'

log "Installing dependencies and building production frontend..."
cd /var/www/carledgr/frontend
sudo -u $DEPLOY_USER bash -c 'source ~/.nvm/nvm.sh && npm install && npm run build'

log "Installing dependencies for demo backend..."
cd /var/www/carledgr-demo/backend
sudo -u $DEPLOY_USER bash -c 'source ~/.nvm/nvm.sh && npm install'

log "Installing dependencies and building demo frontend..."
cd /var/www/carledgr-demo/frontend
sudo -u $DEPLOY_USER bash -c 'source ~/.nvm/nvm.sh && npm install && npm run build'

log "Application setup completed"

# Step 6: Configuration Setup
log "Step 6: Setting up configuration files..."

# Copy existing config files from backend/config/
log "Copying configuration files..."
sudo -u $DEPLOY_USER cp /var/www/carledgr/backend/config/config.example.json /etc/carledgr/config.json
sudo -u $DEPLOY_USER cp /var/www/carledgr-demo/backend/config/config.example.json /etc/carledgr-demo/config.json

# Set proper permissions
chown $DEPLOY_USER:$DEPLOY_USER /etc/carledgr/config.json /etc/carledgr-demo/config.json
chmod 600 /etc/carledgr/config.json /etc/carledgr-demo/config.json

log "Configuration files created (REMEMBER TO UPDATE THEM WITH YOUR CREDENTIALS)"

# Step 7: Service Configuration
log "Step 7: Setting up systemd services..."

# Create production service file
cat > /etc/systemd/system/carledgr-prod.service << EOF
[Unit]
Description=CarLedgr Production Backend
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=/var/www/carledgr/backend
Environment=NODE_ENV=production
Environment=PATH=/home/$DEPLOY_USER/.nvm/versions/node/v$NODE_VERSION/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=CL_BACKEND_CONFIG_FILE=/etc/carledgr/config.json
ExecStart=/home/$DEPLOY_USER/.nvm/versions/node/v$NODE_VERSION/bin/node index.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/carledgr/backend-output.log
StandardError=append:/var/log/carledgr/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Create demo service file
cat > /etc/systemd/system/carledgr-demo.service << EOF
[Unit]
Description=CarLedgr Demo Backend
After=network.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=/var/www/carledgr-demo/backend
Environment=NODE_ENV=production
Environment=PATH=/home/$DEPLOY_USER/.nvm/versions/node/v$NODE_VERSION/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=CL_BACKEND_CONFIG_FILE=/etc/carledgr-demo/config.json
ExecStart=/home/$DEPLOY_USER/.nvm/versions/node/v$NODE_VERSION/bin/node index.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/carledgr-demo/backend-output.log
StandardError=append:/var/log/carledgr-demo/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
systemctl daemon-reload
systemctl enable carledgr-demo carledgr-prod

log "Systemd services configured"

# Step 8: Caddy Configuration
log "Step 8: Configuring Caddy..."

# Create Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
# Marketing website
carledgr.com, www.carledgr.com {
    root * /var/www/carledgr/website
    file_server
    encode gzip
    
    # Enable logging
    log {
        output file /var/log/carledgr/website-access.log
    }
}

# Production frontend
app.carledgr.com {
    root * /var/www/carledgr/frontend/dist
    file_server
    encode gzip
    
    # Handle SPA routing
    try_files {path} /index.html
    
    # Enable logging
    log {
        output file /var/log/carledgr/frontend-access.log
    }
}

# Production backend API
api.carledgr.com {
    reverse_proxy localhost:3030
    encode gzip
    
    # Enable logging
    log {
        output file /var/log/carledgr/backend-access.log
    }
}

# Demo frontend
demo.carledgr.com {
    root * /var/www/carledgr-demo/frontend/dist
    file_server
    encode gzip
    
    # Handle SPA routing
    try_files {path} /index.html
    
    # Enable logging
    log {
        output file /var/log/carledgr-demo/frontend-access.log
    }
}

# Demo backend API
demo-api.carledgr.com {
    reverse_proxy localhost:3001
    encode gzip
    
    # Enable logging
    log {
        output file /var/log/carledgr-demo/backend-access.log
    }
}
EOF

# Enable and start Caddy
systemctl enable caddy
systemctl start caddy

log "Caddy configured and started"

# Step 9: Firewall Configuration
log "Step 9: Configuring firewall..."

# Configure UFW
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

log "Firewall configured"

# Step 10: Start Services
log "Step 10: Starting services..."

# Start demo backend (production backend started manually when needed)
systemctl start carledgr-demo

log "Demo backend service started"

# Step 11: Final Status Check
log "Step 11: Checking service status..."

echo ""
info "=== SERVICE STATUS ==="
systemctl status caddy --no-pager -l | head -10
echo ""
systemctl status carledgr-demo --no-pager -l | head -10
echo ""

# Step 12: DNS and Final Instructions
log "Deployment completed successfully!"

echo ""
info "=== NEXT STEPS ==="
echo -e "${YELLOW}1. Configure DNS records in your domain registrar:${NC}"
echo "   Type    Name       Value"
echo "   A       @          $VPS_IP"
echo "   A       www        $VPS_IP"
echo "   A       app        $VPS_IP"
echo "   A       api        $VPS_IP"
echo "   A       demo       $VPS_IP"
echo "   A       demo-api   $VPS_IP"
echo ""
echo -e "${YELLOW}2. Update configuration files with your credentials:${NC}"
echo "   - /etc/carledgr/config.json (production)"
echo "   - /etc/carledgr-demo/config.json (demo)"
echo ""
echo -e "${YELLOW}3. Start production backend when ready:${NC}"
echo "   sudo systemctl start carledgr-prod"
echo ""
echo -e "${YELLOW}4. Monitor services:${NC}"
echo "   sudo systemctl status caddy"
echo "   sudo systemctl status carledgr-demo"
echo "   sudo systemctl status carledgr-prod"
echo ""
echo -e "${GREEN}Access your applications at:${NC}"
echo "   - Marketing: https://carledgr.com"
echo "   - Production App: https://app.carledgr.com"
echo "   - Demo App: https://demo.carledgr.com"
echo "   - Demo API: https://demo-api.carledgr.com"
echo ""
warning "IMPORTANT: Update config.json files with your actual credentials before starting production!"

log "Deployment script completed successfully!" 