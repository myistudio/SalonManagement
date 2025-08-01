# 🚀 SalonPro VPS Deployment Checklist

## Pre-Deployment Checklist

### 1. VPS Requirements ✅
- [ ] Ubuntu 20.04+ or CentOS 8+ installed
- [ ] Minimum 2GB RAM, 20GB storage
- [ ] Root or sudo access available
- [ ] Domain name configured (optional but recommended)
- [ ] SSH access to VPS working

### 2. Required Information 📝
Before starting, collect these details:
- [ ] VPS IP address: `_______________`
- [ ] Domain name: `_______________`
- [ ] Database password: `Veenails@2!` (pre-configured) 
- [ ] Session secret (32+ characters): `_______________`
- [ ] SendGrid API key: `_______________`
- [ ] MSG91 API key: `_______________`
- [ ] WhatsApp API credentials: `_______________`

## Deployment Methods

### Method 1: Quick Auto-Deploy Script 🚀 (Recommended)

1. **Upload deployment script to your VPS:**
```bash
# On your VPS
wget https://raw.githubusercontent.com/myistudio/SalonManagement/main/scripts/deploy.sh
chmod +x deploy.sh
```

2. **Edit the script configuration:**
```bash
nano deploy.sh
# Update these variables:
# - REPO_URL="https://github.com/myistudio/SalonManagement.git" (already set)
# - DB_PASSWORD="your_secure_password"
# - DOMAIN="your-domain.com"
```

3. **Run the deployment:**
```bash
sudo ./deploy.sh
```

### Method 2: Manual Deployment 🔧

Follow the detailed steps in `DEPLOYMENT.md`

## Post-Deployment Setup

### 3. Configure Environment Variables
```bash
cd /var/www/salonpro
sudo nano .env.production
```

Update with your actual values:
```env
DATABASE_URL=postgresql://salonpro_user:YOUR_PASSWORD@localhost:5432/salonpro
SESSION_SECRET=YOUR_32_CHAR_SECRET
SENDGRID_API_KEY=SG.YOUR_SENDGRID_KEY
MSG91_API_KEY=YOUR_MSG91_KEY
WHATSAPP_ACCESS_TOKEN=YOUR_WHATSAPP_TOKEN
```

### 4. Restart Application
```bash
pm2 restart salonpro
```

### 5. Verify Deployment ✅

**Check Application Status:**
```bash
# Application status
pm2 status
pm2 logs salonpro

# Web server status
sudo systemctl status nginx

# Database status
sudo systemctl status postgresql

# Disk space
df -h

# Memory usage
free -m
```

**Test Endpoints:**
- [ ] Health check: `http://your-domain.com/api/health`
- [ ] Login page: `http://your-domain.com/login`
- [ ] Dashboard: `http://your-domain.com/dashboard`

**Expected Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-31T...",
  "uptime": 123.456,
  "version": "1.0.0",
  "environment": "production",
  "database": "connected"
}
```

### 6. Initial Admin Login 👤
- **URL:** `https://your-domain.com/login`
- **Email:** `admin@salon.com`
- **Password:** `admin123`
- [ ] Login successful
- [ ] Change default password immediately

### 7. Configure Communication Settings 📱

1. **Navigate to Settings → Communication**
2. **Setup SMS (MSG91):**
   - [ ] API Key configured
   - [ ] Sender ID set
   - [ ] Test SMS sent successfully

3. **Setup Email (SendGrid/SMTP):**
   - [ ] API credentials configured
   - [ ] From email address set
   - [ ] Test email sent successfully

4. **Setup WhatsApp (Ultramsg):**
   - [ ] Access token configured
   - [ ] Instance ID set
   - [ ] Test WhatsApp message sent

### 8. Test Appointment System 📅

1. **Create Test Appointment:**
   - [ ] Visit: `https://your-domain.com/book-appointment`
   - [ ] Select store and service
   - [ ] Enter customer details
   - [ ] Book appointment

2. **Verify Auto-Confirmations:**
   - [ ] SMS confirmation received
   - [ ] Email confirmation received
   - [ ] WhatsApp confirmation received (if configured)

## Security Checklist 🔒

### 9. SSL Certificate
- [ ] SSL certificate installed (Let's Encrypt recommended)
- [ ] HTTPS redirect working
- [ ] SSL grade A- or better

### 10. Firewall Configuration
```bash
sudo ufw status
# Should show:
# 22/tcp ALLOW (SSH)
# 80/tcp ALLOW (HTTP)
# 443/tcp ALLOW (HTTPS)
```

### 11. Security Headers
Check your site at: https://securityheaders.com/
- [ ] Security headers configured in Nginx
- [ ] No sensitive information in error messages
- [ ] Strong session secrets used

## Backup Setup 💾

### 12. Database Backups
- [ ] Backup script created: `/home/backup.sh`
- [ ] Cron job scheduled for daily backups
- [ ] Test backup creation: `sudo /home/backup.sh`
- [ ] Verify backup file created in `/home/backups/`

## Monitoring Setup 📊

### 13. Log Monitoring
```bash
# Application logs
pm2 logs salonpro

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u postgresql -f
```

### 14. Performance Monitoring
- [ ] PM2 monitoring dashboard: `pm2 monit`
- [ ] Server resource monitoring setup
- [ ] Application performance baseline established

## Troubleshooting 🔧

### Common Issues and Solutions

**Application won't start:**
```bash
pm2 logs salonpro
# Check for database connection errors, missing environment variables
```

**Database connection failed:**
```bash
sudo systemctl status postgresql
PGPASSWORD="Veenails@2!" psql -U salonpro_user -h localhost -d salonpro -c "SELECT version();"
```

**Nginx configuration error:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## Maintenance Commands 🛠️

### Regular Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart application
pm2 restart salonpro

# Reload Nginx configuration
sudo nginx -s reload

# Check disk space
df -h

# Clean old backups (keeps last 7 days)
find /home/backups -name "salonpro_*.sql" -mtime +7 -delete
```

### Application Updates
```bash
cd /var/www/salonpro
git pull origin main
npm install
npm run build
pm2 restart salonpro
```

## Success Criteria ✅

Your deployment is successful when:
- [ ] Application loads without errors
- [ ] Admin login works
- [ ] All sections accessible (Dashboard, Customers, Inventory, etc.)
- [ ] Appointment booking system functional
- [ ] Auto-confirmation SMS/email working
- [ ] SSL certificate active
- [ ] Database backups running
- [ ] Monitoring and logs accessible

## Support Resources 📚

- **Health Check Endpoint:** `/api/health`
- **Application Logs:** `pm2 logs salonpro`
- **Error Logs:** `/var/log/salonpro/error.log`
- **Nginx Logs:** `/var/log/nginx/`
- **Database Logs:** `/var/log/postgresql/`

---

## Quick Reference Commands

```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs salonpro --lines 100

# Restart application
pm2 restart salonpro

# Check nginx status
sudo systemctl status nginx

# Test database connection
PGPASSWORD="Veenails@2!" psql -U salonpro_user -h localhost -d salonpro -c "SELECT COUNT(*) FROM stores;"

# Check SSL certificate
curl -I https://your-domain.com

# Monitor system resources
htop
```

🎉 **Congratulations!** Your SalonPro application is now live and ready for production use!