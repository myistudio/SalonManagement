#!/bin/bash

# Remote Diagnostic Script for SalonPro VPS
# Run this ON your VPS server at 173.212.252.179

echo "🔍 SalonPro VPS Remote Diagnostic"
echo "=================================="

APP_DIR="/var/www/salonpro"

# Check if we're on the VPS
if [ ! -d "$APP_DIR" ]; then
    echo "❌ This script must be run ON the VPS server (173.212.252.179)"
    echo "   Application directory $APP_DIR not found"
    echo ""
    echo "🚀 To run this on your VPS:"
    echo "   ssh root@173.212.252.179"
    echo "   curl -sSL https://raw.githubusercontent.com/myistudio/SalonManagement/main/scripts/remote-diagnose.sh | bash"
    exit 1
fi

cd $APP_DIR

echo "✅ Running on VPS server"
echo ""

# Check Node.js application
echo "1. 🔍 Checking Node.js Application Status"
echo "-----------------------------------------"

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Node.js app is running on port 3000"
    RESPONSE=$(curl -s http://localhost:3000/api/health)
    echo "   Health response: $RESPONSE"
else
    echo "❌ Node.js app is NOT running on port 3000"
    echo "   This is the cause of your 502 error!"
    
    echo ""
    echo "🔧 Checking PM2 processes..."
    if command -v pm2 &> /dev/null; then
        pm2 list
        
        echo ""
        echo "🚀 Attempting to start application..."
        
        # Stop any existing processes
        pm2 stop salonpro 2>/dev/null || true
        pm2 delete salonpro 2>/dev/null || true
        
        # Try to start with different methods
        if [ -f "ecosystem.config.cjs" ]; then
            echo "Starting with ecosystem.config.cjs..."
            pm2 start ecosystem.config.cjs --env production
        elif [ -f "ecosystem.config.js" ]; then
            echo "Starting with ecosystem.config.js..."
            pm2 start ecosystem.config.js --env production
        else
            echo "Starting manually..."
            pm2 start server/index.ts --name salonpro --interpreter tsx --env production
        fi
        
        pm2 save
        
        # Wait and check again
        echo "Waiting 10 seconds for startup..."
        sleep 10
        
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Application started successfully!"
        else
            echo "❌ Application failed to start"
            echo "📋 PM2 logs:"
            pm2 logs salonpro --lines 20
        fi
    else
        echo "❌ PM2 not installed"
        echo "📦 Installing PM2..."
        npm install -g pm2
    fi
fi

echo ""
echo "2. 🌐 Checking Nginx Configuration"
echo "----------------------------------"

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
    echo "🚀 Starting Nginx..."
    systemctl start nginx
    systemctl enable nginx
fi

if [ -f "/etc/nginx/sites-enabled/salonpro" ]; then
    echo "✅ SalonPro site is enabled"
else
    echo "❌ SalonPro site is NOT enabled"
    echo "🔧 Creating Nginx configuration..."
    
    cat > /etc/nginx/sites-available/salonpro << 'EOF'
server {
    listen 80;
    server_name 173.212.252.179;
    
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
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/salonpro /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    if nginx -t; then
        systemctl reload nginx
        echo "✅ Nginx configuration created and reloaded"
    else
        echo "❌ Nginx configuration test failed"
        nginx -t
    fi
fi

echo ""
echo "3. 🧪 Final Connectivity Test"
echo "-----------------------------"

echo -n "Local health check (localhost:3000): "
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

echo -n "External access test (173.212.252.179): "
if curl -s http://173.212.252.179 > /dev/null 2>&1; then
    echo "✅ Working - 502 error should be fixed!"
else
    echo "❌ Still getting 502 error"
    echo ""
    echo "📋 Nginx error logs:"
    tail -n 10 /var/log/nginx/error.log 2>/dev/null || echo "No error logs found"
fi

echo ""
echo "📊 Summary"
echo "----------"
echo "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
echo "PM2: $(pm2 --version 2>/dev/null || echo 'Not found')"
echo "Nginx: $(nginx -v 2>&1 | cut -d' ' -f3 2>/dev/null || echo 'Not found')"

echo ""
echo "📝 Port Status:"
netstat -tlnp | grep -E ':(80|3000)' || echo "No processes listening on ports 80 or 3000"

echo ""
echo "🎯 Next Steps:"
echo "1. If still 502 error: Check PM2 logs with 'pm2 logs salonpro'"
echo "2. Monitor: 'pm2 monit'"
echo "3. Restart if needed: 'pm2 restart salonpro'"
echo "4. Test: curl http://173.212.252.179"