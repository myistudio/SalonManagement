#!/bin/bash

# Fix Nginx 502 Bad Gateway for SalonPro
echo "🔧 Fixing Nginx configuration for SalonPro..."

# Create Nginx configuration
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

# Enable the site
echo "✅ Enabling SalonPro site..."
sudo ln -sf /etc/nginx/sites-available/salonpro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    sudo systemctl enable nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration test failed"
    exit 1
fi

# Check if Node.js application is running
echo "🔍 Checking Node.js application..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Node.js application is running on port 3000"
else
    echo "⚠️  Node.js application is not running on port 3000"
    echo "💡 Start it with: cd /var/www/salonpro && pm2 start ecosystem.config.cjs"
fi

# Check Nginx status
echo "📊 Nginx status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "🌐 Try accessing: http://173.212.252.179"
echo "📋 Check logs: sudo tail -f /var/log/nginx/salonpro.error.log"