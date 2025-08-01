#!/bin/bash

# Fix PM2 Configuration for SalonPro
# This script fixes the tsx interpreter issue

set -e

PROJECT_DIR="/var/www/salonpro"
log() { echo -e "\033[0;32m[$(date +'%H:%M:%S')] $1\033[0m"; }

log "Fixing PM2 configuration..."

# Stop existing PM2 processes
pm2 delete salonpro 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Navigate to project directory
cd $PROJECT_DIR

# Create corrected PM2 ecosystem config
log "Creating corrected PM2 configuration..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'salonpro',
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader tsx/esm',
      cwd: '/var/www/salonpro',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://salonpro_user:Veenails@2024!@localhost:5432/salonpro',
        SESSION_SECRET: 'salon-pro-secret-key-change-in-production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 3,
      min_uptime: '10s',
      restart_delay: 4000,
      error_file: '/var/log/salonpro-error.log',
      out_file: '/var/log/salonpro-out.log',
      log_file: '/var/log/salonpro.log',
      time: true,
      kill_timeout: 5000
    }
  ]
};
EOF

# Alternative: Create a simple startup script
log "Creating startup script as backup..."
cat > start.js << 'EOF'
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const child = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '3000',
    DATABASE_URL: 'postgresql://salonpro_user:Veenails@2024!@localhost:5432/salonpro'
  }
});

child.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
EOF

# Create even simpler PM2 config using the startup script
cat > ecosystem.simple.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'salonpro',
      script: 'start.js',
      cwd: '/var/www/salonpro',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'postgresql://salonpro_user:Veenails@2024!@localhost:5432/salonpro'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
};
EOF

# Try starting with the corrected config first
log "Attempting to start with corrected PM2 config..."
if pm2 start ecosystem.config.cjs --env production 2>/dev/null; then
    log "Started successfully with corrected config"
else
    log "Corrected config failed, trying simple config..."
    if pm2 start ecosystem.simple.cjs --env production 2>/dev/null; then
        log "Started successfully with simple config"
    else
        log "PM2 configs failed, starting directly with npm..."
        
        # Create package.json script approach
        cat > package.json << 'PKGEOF'
{
  "name": "salonpro",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "NODE_ENV=production tsx server/index.ts",
    "pm2:start": "pm2 start npm --name salonpro -- start"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@neondatabase/serverless": "^0.10.4",
    "bcrypt": "^6.0.0",
    "connect-pg-simple": "^10.0.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "tsx": "^4.19.1",
    "ws": "^8.18.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "drizzle-kit": "^0.30.4",
    "typescript": "5.6.3"
  }
}
PKGEOF
        
        # Install dependencies
        npm install
        
        # Start with PM2 using npm
        export NODE_ENV=production
        export DATABASE_URL="postgresql://salonpro_user:Veenails@2024!@localhost:5432/salonpro"
        
        pm2 start npm --name "salonpro" -- start
    fi
fi

# Save PM2 configuration
pm2 save

# Wait and check status
sleep 3
pm2 status salonpro

# Test application
log "Testing application..."
sleep 2
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "✅ Application is running successfully!"
    echo ""
    echo "🎉 SalonPro is now accessible at:"
    echo "   http://173.212.252.179"
    echo "   Login: admin@salonpro.com / admin123"
else
    log "⚠️ Application may still be starting up..."
    echo "Check logs with: pm2 logs salonpro"
fi

echo ""
echo "Management commands:"
echo "  pm2 status salonpro"
echo "  pm2 logs salonpro"
echo "  pm2 restart salonpro"
EOF

chmod +x fix-pm2-config.sh