#!/bin/bash

echo "🔍 Diagnosing 502 Bad Gateway Error for SalonPro"
echo "=============================================="

# Check if Node.js app is running on port 3000
echo "1. Checking Node.js application..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Node.js app is running on port 3000"
    echo "   Response: $(curl -s http://localhost:3000/api/health)"
else
    echo "❌ Node.js app is NOT running on port 3000"
    echo "   This is likely the cause of 502 error"
    
    # Check PM2 status
    echo "📊 PM2 Status:"
    pm2 list
    
    echo ""
    echo "🔧 Attempting to start the application..."
    cd /var/www/salonpro
    
    # Try different startup methods
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
    
    echo "Waiting 5 seconds for startup..."
    sleep 5
    
    # Check again
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo "✅ Application started successfully!"
    else
        echo "❌ Application still not responding"
        echo "📋 Application logs:"
        pm2 logs salonpro --lines 10
    fi
fi

echo ""
echo "2. Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-enabled/salonpro" ]; then
    echo "✅ SalonPro Nginx site is enabled"
else
    echo "❌ SalonPro Nginx site is NOT enabled"
    echo "🔧 Creating Nginx configuration..."
    
    sudo tee /etc/nginx/sites-available/salonpro > /dev/null <<'EOF'
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
    
    sudo ln -sf /etc/nginx/sites-available/salonpro /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "✅ Nginx configuration updated and reloaded"
    else
        echo "❌ Nginx configuration test failed"
    fi
fi

echo ""
echo "3. Testing connectivity..."
echo -n "Local health check: "
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

echo -n "External access test: "
if curl -s http://173.212.252.179 > /dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed (502 error likely)"
fi

echo ""
echo "📋 System Status:"
echo "Node.js: $(node --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1)"

echo ""
echo "📊 Port Usage:"
echo "Port 3000: $(sudo netstat -tlnp | grep :3000 || echo 'Not in use')"
echo "Port 80: $(sudo netstat -tlnp | grep :80 || echo 'Not in use')"

echo ""
echo "📝 Recent Nginx Error Logs:"
sudo tail -n 5 /var/log/nginx/error.log 2>/dev/null || echo "No error logs found"

echo ""
echo "🔧 Next Steps:"
echo "1. If Node.js app isn't running: pm2 restart salonpro"
echo "2. If Nginx config missing: Run this script again"
echo "3. Check logs: pm2 logs salonpro"
echo "4. Check Nginx logs: sudo tail -f /var/log/nginx/error.log"