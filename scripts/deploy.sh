#!/bin/bash

# SalonPro VPS Deployment Script
# Run this script on your VPS to deploy the application

set -e

# Configuration
APP_NAME="salonpro"
APP_DIR="/var/www/salonpro"
REPO_URL="https://github.com/myistudio/SalonManagement.git"
DB_NAME="salonpro"
DB_USER="salonpro_user"
DB_PASSWORD="your_secure_password"
DOMAIN="your-domain.com"

echo "🚀 Starting SalonPro deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

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

# Configure PostgreSQL
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/14/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/14/main/pg_hba.conf
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Clone repository
echo "📥 Cloning repository..."
sudo mkdir -p $APP_DIR
cd $APP_DIR
sudo git clone $REPO_URL . || (cd $APP_DIR && sudo git pull origin main)

# Install dependencies
echo "📦 Installing application dependencies..."
sudo npm install

# Build application
echo "🔨 Building application..."
sudo npm run build

# Setup environment
echo "⚙️ Setting up environment..."
sudo cp .env.production.example .env.production
echo "⚠️  Please edit /var/www/salonpro/.env.production with your actual configuration!"

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
pm2 start ecosystem.config.js --env production
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
NODE_ENV=production npm run db:push

# Create admin user
echo "👤 Creating admin user..."
NODE_ENV=production npm run seed:admin

# Setup backup cron job
echo "💾 Setting up database backups..."
sudo tee /home/backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/backups"
mkdir -p \$BACKUP_DIR
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME > \$BACKUP_DIR/salonpro_\$DATE.sql
find \$BACKUP_DIR -name "salonpro_*.sql" -mtime +7 -delete
EOF

sudo chmod +x /home/backup.sh
echo "0 2 * * * /home/backup.sh" | sudo crontab -

echo "✅ Deployment completed successfully!"
echo ""
echo "🎉 Your SalonPro application is now running!"
echo "🌐 URL: http://$DOMAIN (or https://$DOMAIN if SSL was configured)"
echo ""
echo "👤 Admin Login:"
echo "   Email: admin@salon.com"
echo "   Password: admin123"
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