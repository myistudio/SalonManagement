# Salon Management System - Server Deployment Guide

## Quick Start with Docker (Recommended)

1. **Clone your project** to your server
2. **Copy the files** from this Replit to your server
3. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

## Manual Deployment Options

### Option 1: VPS/Cloud Server (Ubuntu/Debian)

#### Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

#### Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE salon_db;
CREATE USER salon_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;
\q
```

#### Application Setup
```bash
# Clone your application
git clone <your-repo-url> salon-app
cd salon-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your settings

# Build the application
npm run build

# Setup database schema
npm run db:push

# Start with PM2
pm2 start dist/index.js --name salon-app
pm2 startup
pm2 save
```

#### Nginx Configuration
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/salon-app

# Add the configuration (see nginx.conf)
# Enable the site
sudo ln -s /etc/nginx/sites-available/salon-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Shared Hosting with Node.js Support

1. **Upload files** via FTP/SFTP
2. **Install dependencies**: `npm install`
3. **Build application**: `npm run build`
4. **Configure environment** variables in hosting panel
5. **Set startup file** to `dist/index.js`
6. **Setup database** connection (usually MySQL/PostgreSQL)

### Option 3: Cloud Platforms

#### Heroku
```bash
# Install Heroku CLI
# Login and create app
heroku create your-salon-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SESSION_SECRET=your_secret_key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run database migrations
heroku run npm run db:push
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Configure build command: `npm run build`
4. Configure run command: `node dist/index.js`
5. Add PostgreSQL database addon

#### Railway
1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables
4. Deploy automatically

## Environment Variables Required

```bash
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your_very_long_random_session_secret
NODE_ENV=production
PORT=5000

# Optional (for Replit Auth integration)
REPL_ID=your_repl_id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.com
```

## SSL Certificate Setup

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL
1. Purchase SSL certificate from provider
2. Download certificate files
3. Configure in Nginx or application

## Database Backup

```bash
# Create backup
pg_dump -U salon_user -h localhost salon_db > backup.sql

# Restore backup
psql -U salon_user -h localhost salon_db < backup.sql

# Automated daily backup
echo "0 2 * * * pg_dump -U salon_user salon_db > /backups/salon_$(date +\%Y\%m\%d).sql" | crontab -
```

## Monitoring & Maintenance

### PM2 Monitoring
```bash
pm2 monit          # Real-time monitoring
pm2 logs salon-app # View logs
pm2 restart salon-app # Restart application
```

### Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop netstat

# Check system resources
htop
df -h  # Disk usage
free -h # Memory usage
```

## Security Checklist

- [ ] Enable firewall (ufw enable, allow 22,80,443)
- [ ] Regular system updates
- [ ] Strong database passwords
- [ ] SSL certificate installed
- [ ] Backup strategy implemented
- [ ] Monitor application logs
- [ ] Rate limiting configured
- [ ] Security headers configured

## Troubleshooting

### Common Issues
1. **Port already in use**: Change PORT in .env
2. **Database connection failed**: Check DATABASE_URL
3. **Build failures**: Check Node.js version (use v20)
4. **Permission errors**: Check file permissions
5. **SSL issues**: Verify certificate paths

### Performance Optimization
1. Enable gzip compression
2. Configure CDN for static assets
3. Database indexing
4. Connection pooling
5. Caching strategies

## Support
- Check application logs: `pm2 logs salon-app`
- Database logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`