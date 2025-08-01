#!/bin/bash

# SalonPro VPS Troubleshooting Script

APP_DIR="/var/www/salonpro"
DB_NAME="salonpro"
DB_USER="salonpro_user"
DB_PASSWORD="Veenails@2!"

echo "🔧 SalonPro Troubleshooting Script"
echo "=================================="

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Application directory $APP_DIR does not exist"
    echo "   Run the deployment script first"
    exit 1
fi

cd $APP_DIR

echo ""
echo "📊 System Status Check:"
echo "----------------------"

# Check Node.js
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo "✅ $(node --version)"
else
    echo "❌ Not installed"
fi

# Check NPM
echo -n "NPM: "
if command -v npm &> /dev/null; then
    echo "✅ $(npm --version)"
else
    echo "❌ Not installed"
fi

# Check PM2
echo -n "PM2: "
if command -v pm2 &> /dev/null; then
    echo "✅ $(pm2 --version)"
else
    echo "❌ Not installed"
fi

# Check PostgreSQL
echo -n "PostgreSQL: "
if systemctl is-active --quiet postgresql; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

# Check Nginx
echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo "✅ Running"
else
    echo "❌ Not running"
fi

echo ""
echo "🗄️ Database Status:"
echo "------------------"

# Test database connection
echo -n "Database Connection: "
PGPASSWORD="$DB_PASSWORD" psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT version();" &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Connected"
    
    # Check tables
    TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U $DB_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "Database Tables: $TABLE_COUNT"
else
    echo "❌ Connection failed"
fi

echo ""
echo "📱 Application Status:"
echo "--------------------"

# Check PM2 status
echo "PM2 Processes:"
pm2 list 2>/dev/null | grep -E "(salonpro|online|stopped|errored)" || echo "No PM2 processes found"

echo ""
echo -n "Application Health: "
if curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "✅ Healthy"
else
    echo "❌ Not responding"
fi

echo ""
echo "🌐 Nginx Status:"
echo "---------------"
echo -n "Nginx Configuration: "
if sudo nginx -t &> /dev/null; then
    echo "✅ Valid"
else
    echo "❌ Invalid"
fi

echo -n "SalonPro Site Enabled: "
if [ -f "/etc/nginx/sites-enabled/salonpro" ]; then
    echo "✅ Yes"
else
    echo "❌ No"
fi

echo -n "Default Site Disabled: "
if [ ! -f "/etc/nginx/sites-enabled/default" ]; then
    echo "✅ Yes"
else
    echo "❌ Still enabled"
fi

echo -n "Proxy Test (localhost:3000): "
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Responding"
else
    echo "❌ Not responding"
fi

echo ""
echo "📁 File System Check:"
echo "--------------------"

# Check important files
echo -n ".env.production: "
if [ -f ".env.production" ]; then
    echo "✅ Exists"
else
    echo "❌ Missing"
fi

echo -n "package.json: "
if [ -f "package.json" ]; then
    echo "✅ Exists"
else
    echo "❌ Missing"
fi

echo -n "node_modules: "
if [ -d "node_modules" ]; then
    echo "✅ Exists"
else
    echo "❌ Missing"
fi

echo -n "uploads directory: "
if [ -d "uploads" ]; then
    echo "✅ Exists ($(sudo find uploads -type f | wc -l) files)"
else
    echo "❌ Missing"
fi

echo ""
echo "🔧 Quick Fixes:"
echo "--------------"
echo "1. Restart application:     pm2 restart salonpro"
echo "2. Restart database:        sudo systemctl restart postgresql"
echo "3. Restart web server:      sudo systemctl restart nginx"
echo "4. Check application logs:  pm2 logs salonpro"
echo "5. Check system logs:       sudo journalctl -u postgresql -f"
echo "6. Rebuild application:     npm run build && pm2 restart salonpro"
echo "7. Reset database:          sudo NODE_ENV=production npm run db:push"
echo "8. Fix 502 error:           curl -sSL https://raw.githubusercontent.com/myistudio/SalonManagement/main/scripts/diagnose-502.sh | bash"

echo ""
echo "⚠️ Common Issues & Solutions:"
echo "---------------------------"

# Check for common issues
if ! systemctl is-active --quiet postgresql; then
    echo "• PostgreSQL not running → sudo systemctl start postgresql"
fi

if ! pm2 list 2>/dev/null | grep -q salonpro; then
    echo "• SalonPro not in PM2 → cd $APP_DIR && pm2 start ecosystem.config.js --env production"
fi

if [ ! -f ".env.production" ]; then
    echo "• Missing environment file → Copy from .env.production.example"
fi

if ! curl -f http://localhost:3000/api/health &> /dev/null; then
    echo "• Application not responding → Check pm2 logs salonpro"
fi

PGPASSWORD="$DB_PASSWORD" psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT version();" &> /dev/null
if [ $? -ne 0 ]; then
    echo "• Database connection failed → Check PostgreSQL status and credentials"
fi

echo ""
echo "📞 Support Information:"
echo "----------------------"
echo "Health Check: curl http://localhost:3000/api/health"
echo "Database Test: PGPASSWORD=\"$DB_PASSWORD\" psql -U $DB_USER -h localhost -d $DB_NAME -c \"SELECT version();\""
echo "Application Logs: pm2 logs salonpro --lines 50"
echo "System Resources: htop or top"
echo ""
echo "Troubleshooting complete! ✅"