#!/bin/bash

# PM2 Manual Start Script for SalonPro
# Use this if ecosystem.config.js/cjs is causing issues

APP_DIR="/var/www/salonpro"
cd $APP_DIR

echo "🚀 Starting SalonPro with PM2..."

# Stop any existing instance
pm2 stop salonpro 2>/dev/null || true
pm2 delete salonpro 2>/dev/null || true

# Start the application manually
pm2 start server/index.ts \
  --name salonpro \
  --interpreter tsx \
  --env production \
  --max-memory-restart 1G \
  --error /var/log/salonpro/error.log \
  --output /var/log/salonpro/out.log \
  --log /var/log/salonpro/combined.log \
  --time

# Save PM2 configuration
pm2 save

echo "✅ SalonPro started successfully!"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs salonpro"
echo "🧪 Test health: curl http://localhost:3000/api/health"