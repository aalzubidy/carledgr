# CarLedgr VPS Deployment Documentation

## Overview
This document provides complete instructions for deploying CarLedgr on a fresh Ubuntu VPS. The deployment includes:
- Marketing website (carledgr.com, www.carledgr.com)
- Production frontend (app.carledgr.com)
- Production backend API (api.carledgr.com)
- Demo frontend (demo.carledgr.com)
- Demo backend API (demo-api.carledgr.com)

## Prerequisites
- Fresh Ubuntu 24.04 VPS
- Root access or sudo privileges
- Domain name (carledgr.com) with DNS management access
- Environment variables configured (see Environment Variables section)

## Quick Start
Run the automated deployment script:
```bash
./deploy.sh
```

## Manual Deployment Steps

### 1. System Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip nginx-light caddy

# Remove nginx (we use Caddy instead)
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo apt remove -y nginx-light
```

### 2. User Management
```bash
# Create deploy user
sudo useradd -m -s /bin/bash deploy
echo 'xxxx' | sudo chpasswd
sudo usermod -aG sudo deploy

# Add deploy user to caddy group for log access
sudo usermod -a -G caddy deploy
```

### 3. Directory Structure
```bash
# Create application directories
sudo mkdir -p /var/www/{carledgr,carledgr-demo}/{backend,frontend,website}
sudo mkdir -p /var/log/{carledgr,carledgr-demo}
sudo mkdir -p /etc/{carledgr,carledgr-demo}

# Set ownership and permissions
sudo chown -R deploy:deploy /var/www/carledgr /var/www/carledgr-demo
sudo chown -R caddy:caddy /var/log/carledgr /var/log/carledgr-demo
sudo chmod -R 775 /var/log/carledgr /var/log/carledgr-demo
sudo chown -R deploy:deploy /etc/carledgr /etc/carledgr-demo
```

### 4. Node.js Installation (via nvm)
```bash
# Install nvm for deploy user
sudo -u deploy bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash'
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && nvm install 22.17.0 && nvm use 22.17.0'
```

### 5. Application Deployment
```bash
# Clone repository
cd /var/www/carledgr
sudo -u deploy git clone https://github.com/your-username/carledgr.git .
cd /var/www/carledgr-demo
sudo -u deploy git clone https://github.com/your-username/carledgr.git .

# Install dependencies and build
cd /var/www/carledgr/backend
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && npm install'

cd /var/www/carledgr/frontend
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && npm install && npm run build'

cd /var/www/carledgr-demo/backend
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && npm install'

cd /var/www/carledgr-demo/frontend
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && npm install && npm run build'
```

### 6. Configuration Setup
Create configuration files in `/etc/carledgr/` and `/etc/carledgr-demo/` directories using the provided config template.

### 7. Service Configuration
Copy the systemd service files:
```bash
sudo cp server-deployment/carledgr-prod.service /etc/systemd/system/
sudo cp server-deployment/carledgr-demo.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable carledgr-demo carledgr-prod
```

### 8. Caddy Configuration
```bash
sudo cp server-deployment/Caddyfile /etc/caddy/
sudo systemctl enable caddy
sudo systemctl start caddy
```

### 9. Start Services
```bash
# Start demo backend only (production backend starts manually when needed)
sudo systemctl start carledgr-demo
```

## Configuration Files

### Production Configuration (/etc/carledgr/config.json)
Use the `config-template.json` as a starting point. Update all placeholder values with your actual credentials.

### Demo Configuration (/etc/carledgr-demo/config.json)
Same as production but with:
- `"port": 3001`
- Test Stripe keys (sk_test_...)
- Separate database or demo data

### Environment Variable
The backend uses a single environment variable `CL_BACKEND_CONFIG_FILE` which points to the config file location. This is set automatically in the systemd service files:
- Production: `CL_BACKEND_CONFIG_FILE=/etc/carledgr/config.json`
- Demo: `CL_BACKEND_CONFIG_FILE=/etc/carledgr-demo/config.json`

## DNS Configuration
Configure these DNS records in your domain registrar (Namecheap):

| Type | Name     | Value           | TTL |
|------|----------|-----------------|-----|
| A    | @        | YOUR_VPS_IP     | 300 |
| A    | www      | YOUR_VPS_IP     | 300 |
| A    | app      | YOUR_VPS_IP     | 300 |
| A    | api      | YOUR_VPS_IP     | 300 |
| A    | demo     | YOUR_VPS_IP     | 300 |
| A    | demo-api | YOUR_VPS_IP     | 300 |

## SSL Certificates
Caddy automatically handles SSL certificate provisioning via Let's Encrypt. Certificates are automatically renewed.

## File Structure
```
/var/www/carledgr/
├── backend/           # Production backend
├── frontend/          # Production frontend
└── website/           # Marketing website

/var/www/carledgr-demo/
├── backend/           # Demo backend
└── frontend/          # Demo frontend

/var/log/carledgr/     # Production logs
/var/log/carledgr-demo/ # Demo logs

/etc/carledgr/         # Production config
/etc/carledgr-demo/    # Demo config
```

## Service Management

### Check Service Status
```bash
sudo systemctl status caddy
sudo systemctl status carledgr-demo
sudo systemctl status carledgr-prod
```

### View Logs
```bash
# Service logs
sudo journalctl -u caddy -f
sudo journalctl -u carledgr-demo -f
sudo journalctl -u carledgr-prod -f

# Application logs
sudo tail -f /var/log/carledgr/backend/app.log
sudo tail -f /var/log/carledgr-demo/backend/app.log
```

### Restart Services
```bash
sudo systemctl restart caddy
sudo systemctl restart carledgr-demo
sudo systemctl restart carledgr-prod
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check file ownership: `ls -la /var/www/`
   - Verify deploy user is in caddy group: `groups deploy`

2. **SSL Certificate Issues**
   - Check DNS propagation: `nslookup carledgr.com`
   - View Caddy logs: `sudo journalctl -u caddy -f`

3. **Service Won't Start**
   - Check environment variables are set
   - Verify Node.js path in service files
   - Check service logs: `sudo journalctl -u service-name -f`

4. **Database Connection Issues**
   - Verify database credentials in environment file
   - Check network connectivity to database host

## Security Considerations

1. **Firewall Configuration**
   ```bash
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

2. **User Permissions**
   - Deploy user has sudo access but limited scope
   - Caddy runs as caddy user
   - Application files owned by deploy user

3. **Environment Variables**
   - Store sensitive data in environment files
   - Secure file permissions on config directories

## Backup and Updates

### Backup Strategy
- Database: Regular MySQL dumps
- Application files: Git repository
- Configuration: Environment files and service configs

### Update Process
```bash
cd /var/www/carledgr
sudo -u deploy git pull origin main
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && npm install'
sudo -u deploy bash -c 'source ~/.nvm/nvm.sh && cd frontend && npm run build'
sudo systemctl restart carledgr-prod
```

## Support
For issues or questions, refer to the application logs and this documentation. Common troubleshooting steps are provided above. 