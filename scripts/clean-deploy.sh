#!/bin/bash

# SalonPro Clean Deployment Script
# Use this if the regular deployment failed or you want a fresh start

set -e

APP_NAME="salonpro"
APP_DIR="/var/www/salonpro"
REPO_URL="https://github.com/myistudio/SalonManagement.git"
DB_NAME="salonpro"
DB_USER="salonpro_user"
DB_PASSWORD="Veenails@2!"

echo "🧹 Starting Clean SalonPro Deployment..."
echo "This will remove existing installation and start fresh."
echo ""

# Confirm with user
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Stop existing processes
echo "🛑 Stopping existing processes..."
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Remove existing application directory
echo "🗑️ Removing existing application..."
sudo rm -rf $APP_DIR

# Remove existing database (optional)
echo ""
read -p "Do you want to remove the existing database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️ Removing existing database..."
    sudo -u postgres dropdb $DB_NAME 2>/dev/null || true
    sudo -u postgres dropuser $DB_USER 2>/dev/null || true
fi

# Create fresh application directory
echo "📁 Creating fresh application directory..."
sudo mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo "📥 Cloning repository..."
sudo git clone $REPO_URL .

# Install dependencies
echo "📦 Installing dependencies..."
sudo npm install
sudo npm install -g tsx

# Build application
echo "🔨 Building application..."
sudo npm run build

# Setup database (if it was removed)
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️ Setting up fresh database..."
    sudo -u postgres createdb $DB_NAME
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

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

# Session Secret
SESSION_SECRET=$(openssl rand -base64 32)

# Communication API Keys (update these with your actual keys)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
MSG91_API_KEY=your_msg91_api_key_here
MSG91_SENDER_ID=your_sender_id

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_INSTANCE_ID=your_instance_id
WHATSAPP_BASE_URL=https://api.ultramsg.com

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=$APP_DIR/uploads

# Security Settings
CORS_ORIGIN=https://your-domain.com
TRUST_PROXY=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/salonpro/app.log
EOF

# Setup file permissions
echo "🔐 Setting up file permissions..."
sudo chown -R www-data:www-data $APP_DIR
sudo mkdir -p $APP_DIR/uploads
sudo mkdir -p /var/log/salonpro
sudo chown -R www-data:www-data $APP_DIR/uploads
sudo chown -R www-data:www-data /var/log/salonpro
sudo chmod 755 $APP_DIR/uploads

# Run database migrations
echo "🗄️ Running database migrations..."
sudo NODE_ENV=production npm run db:push

# Create admin user
echo "👤 Creating admin user..."
if [ -f "scripts/seed-admin.ts" ]; then
    sudo NODE_ENV=production npx tsx scripts/seed-admin.ts
else
    echo "⚠️ Seed script not found, you'll need to create admin user manually"
fi

# Start application
echo "🚀 Starting application..."
if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs --env production
elif [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
else
    # Manual PM2 start as fallback
    pm2 start server/index.ts --name salonpro --interpreter tsx --env production
fi
pm2 save

# Test application
echo "🧪 Testing application..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
else
    echo "⚠️ Application may not be responding correctly"
    echo "Check logs with: pm2 logs salonpro"
fi

echo ""
echo "✅ Clean deployment completed!"
echo ""
echo "🎉 Your SalonPro application is now running!"
echo "👤 Admin Login: admin@salon.com / admin123"
echo ""
echo "⚙️ Next steps:"
echo "1. Edit /var/www/salonpro/.env.production with your API keys"
echo "2. Restart: pm2 restart salonpro"
echo "3. Change default admin password"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs salonpro"