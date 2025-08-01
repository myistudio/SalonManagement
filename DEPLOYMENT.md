# SalonPro VPS Deployment Guide

## Prerequisites

### 1. VPS Requirements
- Ubuntu 20.04+ or CentOS 8+
- Minimum 2GB RAM, 20GB storage
- Root or sudo access
- Domain name (optional but recommended)

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

## Database Setup

### 1. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE salonpro;
CREATE USER salonpro_user WITH ENCRYPTED PASSWORD 'Veenails@2!';
GRANT ALL PRIVILEGES ON DATABASE salonpro TO salonpro_user;
\q

# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and set: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add line: host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## Application Deployment

### 1. Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/salonpro
cd /var/www/salonpro

# Clone your repository
git clone https://github.com/myistudio/SalonManagement.git .

# Install dependencies
npm install

# Build the application
npm run build
```

### 2. Environment Configuration

Create production environment file:

```bash
sudo nano .env.production
```

Add the following content:

```env
# Database Configuration
DATABASE_URL=postgresql://salonpro_user:Veenails@2!@localhost:5432/salonpro
PGHOST=localhost
PGPORT=5432
PGUSER=salonpro_user
PGPASSWORD=Veenails@2!
PGDATABASE=salonpro

# Application Configuration
NODE_ENV=production
PORT=3000

# Session Secret (generate a secure random string)
SESSION_SECRET=your_very_secure_session_secret_here

# Communication Settings (add your API keys)
SENDGRID_API_KEY=your_sendgrid_api_key
MSG91_API_KEY=your_msg91_api_key
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_INSTANCE_ID=your_instance_id

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/salonpro/uploads
```

### 3. Database Migration

```bash
# Set environment for production
export NODE_ENV=production

# Run database migrations
npm run db:push

# Optional: Add initial admin user
npm run seed:admin
```

### 4. File Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/salonpro

# Create uploads directory
sudo mkdir -p /var/www/salonpro/uploads
sudo chown -R www-data:www-data /var/www/salonpro/uploads
sudo chmod 755 /var/www/salonpro/uploads
```

## Process Management with PM2

### 1. Create PM2 Configuration

```bash
sudo nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'salonpro',
      script: 'server/index.ts',
      interpreter: 'tsx',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/salonpro/error.log',
      out_file: '/var/log/salonpro/out.log',
      log_file: '/var/log/salonpro/combined.log',
      time: true
    }
  ]
};
```

### 2. Start Application with PM2

```bash
# Create log directory
sudo mkdir -p /var/log/salonpro
sudo chown -R www-data:www-data /var/log/salonpro

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## Nginx Reverse Proxy

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/salonpro
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (add your SSL certificates)
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # File upload size
    client_max_body_size 10M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 2. Enable Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/salonpro /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow PostgreSQL (if external access needed)
sudo ufw allow 5432

# Check status
sudo ufw status
```

## Monitoring and Maintenance

### 1. Log Management

```bash
# View application logs
pm2 logs salonpro

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 2. Database Backup Script

```bash
sudo nano /home/salonpro/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/salonpro/backups"
DB_NAME="salonpro"
DB_USER="salonpro_user"

mkdir -p $BACKUP_DIR

# Create database backup
PGPASSWORD=Veenails@2! pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/salonpro_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "salonpro_*.sql" -mtime +7 -delete

echo "Backup completed: salonpro_$DATE.sql"
```

```bash
chmod +x /home/salonpro/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/salonpro/backup.sh
```

## Deployment Commands

### Initial Deployment
```bash
cd /var/www/salonpro
npm install
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
```

### Update Deployment
```bash
cd /var/www/salonpro
git pull origin main
npm install
npm run build
pm2 restart salonpro
```

## Troubleshooting

### Common Issues

1. **Application won't start**: Check logs with `pm2 logs salonpro`
2. **Database connection**: Verify PostgreSQL service and credentials
3. **Permission errors**: Ensure proper file ownership with `chown -R www-data:www-data /var/www/salonpro`
4. **Nginx errors**: Check configuration with `sudo nginx -t`

### Health Checks

```bash
# Check application status
pm2 status

# Check database connection
psql -U salonpro_user -h localhost -d salonpro -c "SELECT version();"

# Check Nginx status
sudo systemctl status nginx

# Check disk space
df -h

# Check memory usage
free -m
```

## Security Recommendations

1. **Regular Updates**: Keep system and packages updated
2. **Strong Passwords**: Use complex database and session passwords
3. **Firewall**: Only open necessary ports
4. **SSL**: Always use HTTPS in production
5. **Backups**: Regular automated database backups
6. **Monitoring**: Set up log monitoring and alerts
7. **API Keys**: Store sensitive keys in environment variables only

Your SalonPro application should now be successfully deployed and accessible via your domain!