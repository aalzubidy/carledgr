# CarLedgr CI/CD Setup Guide

This guide will help you set up automatic deployment from GitHub to your VPS when you merge to the master branch.

## 🚀 Quick Overview

When you merge code to master, GitHub Actions will:
1. **Detect changes** in website/, frontend/, backend/, or Caddyfile
2. **SSH into your VPS** and run the deployment script
3. **Deploy only changed components** (smart deployment)
4. **Restart services** only if needed
5. **Run health checks** to verify everything is working

---

## 📋 Setup Steps

### Step 1: VPS Setup (SSH Key Authentication)

#### 1.1 Generate SSH Key for GitHub Actions (on VPS)
```bash
# SSH into your VPS as the deploy user
ssh deploy@144.126.146.231

# Generate a new SSH key specifically for GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""

# Add the public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/github_deploy
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Display the PRIVATE key (you'll need this for GitHub)
cat ~/.ssh/github_deploy
```

**⚠️ IMPORTANT:** Copy the **PRIVATE key** content (the output of `cat ~/.ssh/github_deploy`). This is what you'll put in GitHub secrets.

#### 1.2 Test SSH Key (optional)
```bash
# From your local machine, test the SSH connection
ssh -i /path/to/private/key deploy@144.126.146.231
```

#### 1.3 Set up Git Repository on VPS
```bash
# SSH into VPS as deploy user
ssh deploy@144.126.146.231

# Navigate to the project directory
cd /var/www/carledgr

# Ensure git is configured
git config --global user.email "deploy@carledgr.com"
git config --global user.name "Deploy User"

# Make sure the repository is clean
git status

# If there are uncommitted changes, stash them
git stash

# Set up to track the master branch
git branch --set-upstream-to=origin/master master
```

### Step 2: GitHub Repository Setup

#### 2.1 Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `144.126.146.231` | Your VPS IP address |
| `VPS_USER` | `deploy` | SSH username |
| `VPS_SSH_KEY` | `[PRIVATE KEY CONTENT]` | The private key from Step 1.1 |
| `VPS_PORT` | `22` | SSH port (optional, defaults to 22) |

**For VPS_SSH_KEY:** Paste the entire private key content including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
[key content]
-----END OPENSSH PRIVATE KEY-----
```

#### 2.2 Enable GitHub Actions
The workflow file is already created at `.github/workflows/deploy.yml`. GitHub Actions will automatically detect and run it when you push to master.

### Step 3: VPS Permissions Setup

#### 3.1 Grant Deploy User Sudo Access for Services
```bash
# SSH into VPS as root or a user with sudo access
ssh root@144.126.146.231  # or ssh aj@144.126.146.231

# Create a sudoers file for deploy user
sudo visudo -f /etc/sudoers.d/deploy

# Add these lines to allow deploy user to manage services without password:
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart carledgr-demo
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart carledgr-prod
deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload caddy
deploy ALL=(ALL) NOPASSWD: /bin/systemctl status carledgr-demo
deploy ALL=(ALL) NOPASSWD: /bin/systemctl status carledgr-prod
deploy ALL=(ALL) NOPASSWD: /bin/systemctl status caddy
deploy ALL=(ALL) NOPASSWD: /usr/bin/rsync
```

#### 3.2 Verify Permissions
```bash
# SSH as deploy user and test
ssh deploy@144.126.146.231

# Test sudo commands (should not ask for password)
sudo systemctl status carledgr-demo
sudo systemctl status caddy

# Test script execution
cd /var/www/carledgr
./server-deployment/health-check.sh
```

### Step 4: Test the CI/CD Pipeline

#### 4.1 Make a Test Change
1. Create a new branch: `git checkout -b test-cicd`
2. Make a small change (e.g., edit a comment in `website/index.html`)
3. Commit and push: 
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin test-cicd
   ```
4. Create a Pull Request to master
5. Merge the PR

#### 4.2 Monitor the Deployment
1. Go to GitHub → Actions tab
2. Watch the deployment workflow run
3. Check the logs for any errors
4. Verify the changes are live on your website

---

## 🔧 Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
**Error:** `Permission denied (publickey)`
**Solution:** 
- Verify the private key is correctly added to GitHub secrets
- Check that the public key is in `~/.ssh/authorized_keys` on the VPS
- Ensure proper file permissions (600 for private key, 644 for public key)

#### 2. Git Pull Failed
**Error:** `Your local changes would be overwritten by merge`
**Solution:**
```bash
# SSH into VPS and clean the repository
cd /var/www/carledgr
git stash
git reset --hard origin/master
```

#### 3. Service Restart Failed
**Error:** `Failed to restart service`
**Solution:**
- Check sudoers configuration in Step 3.1
- Verify deploy user has the required permissions
- Check service logs: `sudo journalctl -u carledgr-demo -f`

#### 4. Health Check Failed
**Error:** `Health checks failed`
**Solution:**
- Check if services are running: `sudo systemctl status carledgr-demo`
- Verify SSL certificates are valid
- Check Caddy configuration: `sudo systemctl status caddy`

### Debug Commands

```bash
# Check service status
sudo systemctl status carledgr-demo carledgr-prod caddy

# View service logs
sudo journalctl -u carledgr-demo -f
sudo journalctl -u carledgr-prod -f
sudo journalctl -u caddy -f

# Test deployment script manually
cd /var/www/carledgr
./server-deployment/deploy-update.sh --backend=true --frontend=true

# Run health checks
./server-deployment/health-check.sh

# Check git status
git status
git log --oneline -5
```

---

## 🎯 What Gets Deployed When

| Files Changed | Components Deployed | Services Restarted |
|---------------|--------------------|--------------------|
| `website/**` | Marketing website | None |
| `frontend/**` | Production + Demo frontends | None |
| `backend/**` | Production + Demo backends | carledgr-demo, carledgr-prod |
| `server-deployment/Caddyfile` | Caddy configuration | caddy (reload) |
| `server-deployment/**` | Deployment scripts | None |

---

## 🔒 Security Notes

1. **Private Key Security:** The SSH private key is stored as a GitHub secret and never exposed in logs
2. **Limited Sudo Access:** Deploy user can only restart specific services, not full system access
3. **No Database Access:** Deployment scripts don't modify database, only application code
4. **Rollback Capability:** Git-based deployment allows easy rollbacks if needed

---

## 🚀 Advanced Features (Optional)

### Slack Notifications
Add this to your `.github/workflows/deploy.yml` to get Slack notifications:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Database Migrations
If you need to run database migrations, add this to `deploy-update.sh`:

```bash
# Run database migrations if backend changed
if [[ "$BACKEND_CHANGED" == "true" ]]; then
    log "Running database migrations..."
    cd backend
    npm run migrate  # or your migration command
fi
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] SSH key authentication works
- [ ] Deploy user can restart services without password
- [ ] GitHub Actions workflow runs successfully
- [ ] Test deployment completes without errors
- [ ] Health checks pass
- [ ] All websites/APIs are accessible
- [ ] Services restart only when needed

---

## 🆘 Need Help?

If you encounter issues:

1. Check the GitHub Actions logs first
2. SSH into the VPS and check service logs
3. Run the deployment script manually to isolate issues
4. Verify all permissions and configurations above

The CI/CD pipeline is now ready! Every merge to master will automatically deploy your changes. 🎉 