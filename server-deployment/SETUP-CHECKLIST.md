# CarLedgr Deployment Checklist

Use this checklist to ensure a complete and successful deployment of CarLedgr on a fresh Ubuntu 24.04 VPS.

## Pre-Deployment Requirements

### ✅ VPS Setup
- [ ] Fresh Ubuntu 24.04 VPS provisioned
- [ ] Root or sudo access configured
- [ ] SSH access working
- [ ] VPS IP address noted: `_________________`

### ✅ Domain Configuration
- [ ] Domain name purchased (carledgr.com)
- [ ] DNS management access (Namecheap/other)
- [ ] DNS records ready to configure

### ✅ Third-Party Services
- [ ] Database credentials available (6irvb.h.filess.io)
- [ ] Stripe account set up (live + test keys)
- [ ] Gmail app password created for SMTP
- [ ] DigitalOcean Spaces configured (optional)

## Deployment Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/carledgr.git
cd carledgr
```
- [ ] Repository cloned successfully
- [ ] All files present (backend/, frontend/, website/, server-deployment/)

### Step 2: Run Automated Deployment
```bash
cd server-deployment
sudo ./deploy.sh
```
- [ ] Script executed without errors
- [ ] All dependencies installed
- [ ] Deploy user created
- [ ] Directory structure created
- [ ] Node.js installed via nvm
- [ ] Application files copied
- [ ] Frontend builds completed
- [ ] Services configured
- [ ] Caddy started
- [ ] Firewall configured

### Step 3: Configure DNS Records
In your domain registrar (Namecheap), add these A records:

| Type | Name     | Value (Your VPS IP) | TTL |
|------|----------|---------------------|-----|
| A    | @        | ________________    | 300 |
| A    | www      | ________________    | 300 |
| A    | app      | ________________    | 300 |
| A    | api      | ________________    | 300 |
| A    | demo     | ________________    | 300 |
| A    | demo-api | ________________    | 300 |

- [ ] All DNS records configured
- [ ] DNS propagation confirmed (5-30 minutes)

### Step 4: Update Configuration Files

#### Option A: Manual Update
Edit the files directly:
```bash
sudo nano /etc/carledgr/config.json
sudo nano /etc/carledgr-demo/config.json
```

#### Option B: Use Update Script
```bash
sudo ./update-config.sh
```

**Required Updates:**
- [ ] Database password updated
- [ ] JWT secrets configured (different for prod/demo)
- [ ] Stripe live keys (production)
- [ ] Stripe test keys (demo)
- [ ] Email SMTP credentials
- [ ] DigitalOcean Spaces keys (if used)

### Step 5: Start Services
```bash
# Demo backend should already be running
sudo systemctl status carledgr-demo

# Start production backend when ready
sudo systemctl start carledgr-prod
sudo systemctl status carledgr-prod
```
- [ ] Demo backend running
- [ ] Production backend started (when ready)
- [ ] Caddy service running
- [ ] SSL certificates obtained

## Post-Deployment Verification

### ✅ Website Access
- [ ] https://carledgr.com loads correctly
- [ ] https://www.carledgr.com loads correctly
- [ ] Marketing website displays properly
- [ ] Translation system working

### ✅ Application Access
- [ ] https://app.carledgr.com loads (production frontend)
- [ ] https://demo.carledgr.com loads (demo frontend)
- [ ] Frontend applications display correctly

### ✅ API Endpoints
- [ ] https://api.carledgr.com returns API response
- [ ] https://demo-api.carledgr.com returns API response
- [ ] Backend APIs responding correctly

### ✅ SSL Certificates
- [ ] All domains have valid SSL certificates
- [ ] No SSL warnings in browser
- [ ] HTTP redirects to HTTPS

## Monitoring and Maintenance

### Service Status Commands
```bash
# Check all services
sudo systemctl status caddy
sudo systemctl status carledgr-demo
sudo systemctl status carledgr-prod

# View logs
sudo journalctl -u caddy -f
sudo journalctl -u carledgr-demo -f
sudo journalctl -u carledgr-prod -f
```

### Application Logs
```bash
# Backend application logs
sudo tail -f /var/log/carledgr/backend-error.log
sudo tail -f /var/log/carledgr-demo/backend-error.log

# Caddy access logs
sudo tail -f /var/log/carledgr/website-access.log
sudo tail -f /var/log/carledgr/frontend-access.log
sudo tail -f /var/log/carledgr/backend-access.log
```

### Regular Maintenance
- [ ] Monitor disk space: `df -h`
- [ ] Check service status weekly
- [ ] Review logs for errors
- [ ] Update system packages monthly: `sudo apt update && sudo apt upgrade`
- [ ] Backup database regularly
- [ ] Monitor SSL certificate expiration (auto-renewed by Caddy)

## Troubleshooting Common Issues

### DNS Issues
- Check DNS propagation: `nslookup carledgr.com`
- Verify all A records point to correct IP
- Wait for full DNS propagation (up to 48 hours)

### SSL Certificate Issues
- Check Caddy logs: `sudo journalctl -u caddy -f`
- Verify DNS records exist before certificate request
- Restart Caddy if needed: `sudo systemctl restart caddy`

### Service Startup Issues
- Check environment files exist and have correct permissions
- Verify Node.js path in service files
- Check for port conflicts: `sudo netstat -tlpn`

### Permission Issues
- Verify deploy user is in caddy group: `groups deploy`
- Check directory ownership: `ls -la /var/www/`
- Fix permissions if needed: `sudo chown -R deploy:deploy /var/www/carledgr*`

## Security Checklist
- [ ] Firewall enabled and configured
- [ ] Configuration files have secure permissions (600)
- [ ] Deploy user has limited sudo access
- [ ] SSH key authentication configured (recommended)
- [ ] Regular security updates scheduled

## Backup Strategy
- [ ] Database backup process established
- [ ] Configuration files backed up securely
- [ ] Application code in version control (Git)
- [ ] SSL certificates backed up (auto-managed by Caddy)

---

## Quick Reference

**File Locations:**
- Application: `/var/www/carledgr/` and `/var/www/carledgr-demo/`
- Logs: `/var/log/carledgr/` and `/var/log/carledgr-demo/`
- Config: `/etc/carledgr/` and `/etc/carledgr-demo/`
- Services: `/etc/systemd/system/carledgr-*.service`
- Caddy: `/etc/caddy/Caddyfile`

**Key Commands:**
```bash
# Service management
sudo systemctl {start|stop|restart|status} {caddy|carledgr-demo|carledgr-prod}

# View logs
sudo journalctl -u service-name -f

# Update configuration
sudo ./update-config.sh

# Check processes
sudo netstat -tlpn | grep :3030
sudo netstat -tlpn | grep :3001
```

**Access URLs:**
- Marketing: https://carledgr.com
- Production App: https://app.carledgr.com  
- Production API: https://api.carledgr.com
- Demo App: https://demo.carledgr.com
- Demo API: https://demo-api.carledgr.com 