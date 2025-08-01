#!/bin/bash

# SalonPro VPS Deployment Script
# Run this script on your VPS to deploy the application

set -e

# Configuration
APP_NAME="salonpro"
APP_DIR="/var/www/salonpro"
REPO_URL="https://github.com/myistudio/SalonManagement"
DB_NAME="salonpro"
DB_USER="salonpro_user"
DB_PASSWORD="Veenails@2!"
DOMAIN="your-domain.com"

echo "🚀 Starting SalonPro deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 16
echo "🗄️ Installing PostgreSQL 16..."
sudo apt install postgresql-16 postgresql-contrib-16 -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/salonpro > /dev/null <<'EOF'
server {
    listen 80;
    server_name 173.212.252.179;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Client max body size for file uploads
    client_max_body_size 50M;

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
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Static files (if served directly by Nginx)
    location /uploads {
        alias /var/www/salonpro/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Error and access logs
    access_log /var/log/nginx/salonpro.access.log;
    error_log /var/log/nginx/salonpro.error.log;
}
EOF

sudo ln -sf /etc/nginx/sites-available/salonpro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx

# Install PM2
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Install other dependencies
sudo apt install git certbot python3-certbot-nginx ufw -y

# Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" || true
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true

# Configure PostgreSQL (version 16)
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/16/main/pg_hba.conf
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Clone repository
echo "📥 Setting up repository..."
sudo mkdir -p $APP_DIR
cd $APP_DIR

if [ -d ".git" ]; then
    echo "🔄 Repository exists, updating..."
    sudo git config --global --add safe.directory $APP_DIR
    sudo git fetch origin
    sudo git reset --hard origin/main
    sudo git pull origin main
elif [ "$(ls -A $APP_DIR 2>/dev/null)" ]; then
    echo "🗑️ Directory not empty, cleaning and cloning..."
    sudo rm -rf $APP_DIR/*
    sudo rm -rf $APP_DIR/.* 2>/dev/null || true
    sudo git clone $REPO_URL .
else
    echo "📥 Cloning fresh repository..."
    sudo git clone $REPO_URL .
fi

# Install dependencies
echo "📦 Installing application dependencies..."
sudo npm install

# Install tsx globally for PM2
sudo npm install -g tsx

# Build application
echo "🔨 Building application..."
sudo npm run build

# Setup environment
echo "⚙️ Setting up environment..."
sudo tee $APP_DIR/.env.production > /dev/null <<EOF
# Production Environment Configuration

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME

# Application Configuration
NODE_ENV=production
PORT=3000

# Session Secret (generate a secure random string)
SESSION_SECRET=$(openssl rand -base64 32)

# Communication API Keys (update these with your actual keys)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
MSG91_API_KEY=your_msg91_api_key_here
MSG91_SENDER_ID=your_sender_id

# WhatsApp Business API (Ultramsg)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_INSTANCE_ID=your_instance_id
WHATSAPP_BASE_URL=https://api.ultramsg.com

# SMTP Settings (if not using SendGrid)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=$APP_DIR/uploads

# Security Settings
CORS_ORIGIN=https://$DOMAIN
TRUST_PROXY=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/salonpro/app.log
EOF

echo "✅ Environment file created with database credentials!"
echo "⚠️  Remember to update API keys in /var/www/salonpro/.env.production after deployment!"

# Setup file permissions
echo "🔐 Setting up file permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo mkdir -p $APP_DIR/uploads
sudo mkdir -p /var/log/salonpro
sudo chown -R www-data:www-data $APP_DIR/uploads
sudo chown -R www-data:www-data /var/log/salonpro
sudo chmod 755 $APP_DIR/uploads

# Setup PM2
echo "⚙️ Setting up PM2..."
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs --env production
elif [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    # Manual PM2 start as fallback
    pm2 start server/index.ts --name salonpro --interpreter tsx -- --env production
fi
pm2 save
pm2 startup

# Setup Nginx
echo "🌐 Setting up Nginx..."
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
    
    client_max_body_size 10M;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup firewall
echo "🔥 Setting up firewall..."
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Setup SSL (optional)
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo "🔒 Setting up SSL certificate..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Setup auto-renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
fi

# Setup database migrations
echo "🗄️ Running database migrations..."
cd $APP_DIR
sudo NODE_ENV=production npm run db:push

# Create admin user (if seed script exists)
echo "👤 Creating admin user..."
if [ -f "scripts/seed-admin.ts" ]; then
  sudo NODE_ENV=production npx tsx scripts/seed-admin.ts
else
  echo "⚠️  Seed script not found, you'll need to create admin user manually"
fi

# Setup backup cron job
echo "💾 Setting up database backups..."
sudo tee /home/backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/backups"
mkdir -p \$BACKUP_DIR
PGPASSWORD="$DB_PASSWORD" pg_dump -U $DB_USER -h localhost $DB_NAME > \$BACKUP_DIR/salonpro_\$DATE.sql
find \$BACKUP_DIR -name "salonpro_*.sql" -mtime +7 -delete
EOF

sudo chmod +x /home/backup.sh
echo "0 2 * * * /home/backup.sh" | sudo crontab -

# Test database connection
echo "🧪 Testing database connection..."
PGPASSWORD="$DB_PASSWORD" psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed!"
fi

# Test application health
echo "🧪 Testing application health..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application health check passed!"
else
    echo "⚠️  Application health check failed - check PM2 logs"
fi

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🎉 Your SalonPro application is now running!"
echo "🌐 URL: http://$DOMAIN (or https://$DOMAIN if SSL was configured)"
echo ""
echo "👤 Admin Login:"
echo "   Email: admin@salon.com"
echo "   Password: admin123"
echo ""
echo "🔧 Configuration Details:"
echo "   Database: salonpro (PostgreSQL 16)"
echo "   User: salonpro_user"
echo "   Password: Veenails@2!"
echo "   Repository: https://github.com/myistudio/SalonManagement.git"
echo ""
echo "⚙️ Next steps:"
echo "1. Edit /var/www/salonpro/.env.production with your API keys"
echo "2. Restart the application: pm2 restart salonpro"
echo "3. Change the default admin password"
echo "4. Configure your communication settings (SMS, Email, WhatsApp)"
echo ""
echo "📊 Monitoring commands:"
echo "   pm2 status              - Check application status"
echo "   pm2 logs salonpro       - View application logs"
echo "   sudo systemctl status nginx - Check web server"
echo "   sudo systemctl status postgresql - Check database"
echo ""
echo "🧪 Quick verification:"
echo "   curl http://localhost:3000/api/health"
echo "   PGPASSWORD=\"Veenails@2!\" psql -U salonpro_user -h localhost -d salonpro -c \"SELECT COUNT(*) FROM pg_tables;\""
