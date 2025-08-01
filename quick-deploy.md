# SalonPro One-Click VPS Deployment

## 🚀 Quick Deploy to 173.212.252.179

### Option 1: Direct Execute (Recommended)
```bash
# SSH into your VPS
ssh root@173.212.252.179

# Run the deployment script
curl -sSL https://raw.githubusercontent.com/your-repo/salonpro/main/deploy-to-vps.sh | bash
```

### Option 2: Download and Execute
```bash
# SSH into your VPS
ssh root@173.212.252.179

# Download the script
wget https://raw.githubusercontent.com/your-repo/salonpro/main/deploy-to-vps.sh

# Make executable and run
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

### Option 3: Manual Upload and Execute
```bash
# Upload the deploy-to-vps.sh file to your VPS
# Then SSH and run:
ssh root@173.212.252.179
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

## 📋 What Gets Deployed

### ✅ **Complete System Setup**
- System updates and essential packages
- Node.js 20 with npm and PM2
- PostgreSQL database server
- Nginx reverse proxy
- UFW firewall configuration

### ✅ **SalonPro Application**
- Full project structure with all dependencies
- Production environment configuration
- Database schema with all tables
- Default admin user and sample data
- PM2 process management
- Nginx proxy configuration

### ✅ **Security & Performance**
- Firewall rules (SSH, HTTP, HTTPS)
- Security headers in Nginx
- Gzip compression
- Process monitoring with PM2
- Automatic restarts and logging

## 🎯 **Access Your Application**

After deployment completes:
- **URL**: http://173.212.252.179
- **Login**: admin@salonpro.com
- **Password**: admin123

## 🛠️ **Management Commands**

```bash
# Check application status
/var/www/salonpro/status.sh

# Restart application
/var/www/salonpro/restart.sh

# View logs
/var/www/salonpro/logs.sh

# PM2 commands
pm2 status salonpro
pm2 logs salonpro
pm2 restart salonpro
```

## 🌐 **Subdomain Setup**

After deployment, point your subdomain to `173.212.252.179`:

### DNS Configuration
```
A Record: salonpro.yourdomain.com → 173.212.252.179
```

### Update Nginx for Domain
```bash
# Edit Nginx config
nano /etc/nginx/sites-available/salonpro

# Change server_name line to:
server_name salonpro.yourdomain.com 173.212.252.179;

# Restart Nginx
systemctl restart nginx
```

## 🔒 **Security Recommendations**

### 1. Change Default Passwords
```bash
# Change admin password in the application UI
# Change database password:
sudo -u postgres psql -c "ALTER USER salonpro_user PASSWORD 'your-new-password';"

# Update environment file:
nano /var/www/salonpro/.env.production
```

### 2. Setup SSL Certificate (After Domain Setup)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d salonpro.yourdomain.com
```

### 3. Enable Additional Security
```bash
# Fail2ban for SSH protection
apt install fail2ban

# Configure automatic security updates
apt install unattended-upgrades
dpkg-reconfigure unattended-upgrades
```

## 🐛 **Troubleshooting**

### Application Not Starting
```bash
# Check PM2 status
pm2 status
pm2 logs salonpro

# Check database connection
PGPASSWORD='Veenails@2024!' psql -U salonpro_user -h localhost -d salonpro -c "SELECT version();"
```

### Nginx Issues
```bash
# Check Nginx status
systemctl status nginx

# Test configuration
nginx -t

# Check error logs
tail -f /var/log/nginx/error.log
```

### Database Issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check database logs
tail -f /var/log/postgresql/postgresql-*-main.log
```

## 📊 **Monitoring**

### System Resources
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop
```

### Application Metrics
```bash
# PM2 monitoring
pm2 monit

# Application logs
tail -f /var/log/salonpro.log
```

## 🔄 **Updates and Maintenance**

### Update Application Code
```bash
cd /var/www/salonpro
# Upload new code
pm2 restart salonpro
```

### System Updates
```bash
apt update && apt upgrade -y
pm2 update
```

### Database Backup
```bash
pg_dump -U salonpro_user -h localhost salonpro > backup.sql
```

---

**Total Deployment Time**: ~10-15 minutes
**Requirements**: Root access to VPS
**Result**: Fully functional SalonPro application ready for production use