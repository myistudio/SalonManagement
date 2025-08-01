# 🚀 Quick VPS Deployment for SalonPro

## One-Command Deployment

Run this single command on your Ubuntu VPS to deploy SalonPro:

```bash
curl -sSL https://raw.githubusercontent.com/myistudio/SalonManagement/main/scripts/deploy.sh | sudo bash
```

**Note:** The script uses these pre-configured settings:
- Database Name: `salonpro`
- Database User: `salonpro_user` 
- Database Password: `Veenails@2!`
- Repository: `https://github.com/myistudio/SalonManagement.git`
- PostgreSQL Version: 16

## Before Running

1. **Prepare your VPS:**
   - Ubuntu 20.04+ with minimum 2GB RAM
   - Root or sudo access
   - Domain name pointed to your VPS IP (optional)

2. **What the script does automatically:**
   - ✅ Installs Node.js 20, PostgreSQL, Nginx, PM2
   - ✅ Creates database and user
   - ✅ Clones your repository from https://github.com/myistudio/SalonManagement.git
   - ✅ Builds the application
   - ✅ Configures Nginx reverse proxy
   - ✅ Sets up SSL certificate (if domain provided)
   - ✅ Starts the application with PM2
   - ✅ Creates admin user (admin@salon.com / admin123)

## Customization (Optional)

If you want to customize before deployment:

```bash
# Download and edit the script
wget https://raw.githubusercontent.com/myistudio/SalonManagement/main/scripts/deploy.sh
nano deploy.sh

# Update this variable (password is already set):
DOMAIN="your-domain.com"

# Run the script
chmod +x deploy.sh
sudo ./deploy.sh
```

## After Deployment

1. **Configure API Keys:**
   ```bash
   sudo nano /var/www/salonpro/.env.production
   # Add your SendGrid, MSG91, WhatsApp API keys
   
   pm2 restart salonpro
   ```

2. **Access your application:**
   - URL: `https://your-domain.com` or `http://your-vps-ip`
   - Admin login: `admin@salon.com` / `admin123`

3. **Important next steps:**
   - Change the default admin password
   - Configure SMS/Email/WhatsApp settings
   - Add your stores, services, and products

## Monitoring Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs salonpro

# Restart application
pm2 restart salonpro

# Check database
sudo systemctl status postgresql

# Check web server
sudo systemctl status nginx
```

## Troubleshooting

**Application won't start?**
```bash
pm2 logs salonpro
```

**Database connection issues?**
```bash
sudo systemctl restart postgresql
psql -U salonpro_user -h localhost -d salonpro -c "SELECT version();"
```

**Need to update the application?**
```bash
cd /var/www/salonpro
git pull origin main
npm install
npm run build
pm2 restart salonpro
```

## Health Check

Visit: `http://your-domain.com/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

Your SalonPro application is now ready for production use! 🎉