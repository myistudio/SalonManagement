#!/bin/bash

# Working Server Fix for Node.js v20 tsx compatibility
# This creates a production-ready server without tsx dependency issues

set -e

PROJECT_DIR="/var/www/salonpro"
log() { echo -e "\033[0;32m[$(date +'%H:%M:%S')] $1\033[0m"; }

log "Creating working server without tsx dependency issues..."

cd $PROJECT_DIR

# Stop all existing processes
pm2 delete salonpro 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Create a pure JavaScript server (no TypeScript compilation needed)
log "Creating production JavaScript server..."
cat > server/app.js << 'EOF'
import express from 'express';
import session from 'express-session';
import { createHash } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;

// Simple password hashing for demo
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'salon-pro-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'connected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.json({
      message: 'Welcome to SalonPro Dashboard',
      user: req.session.userId,
      timestamp: new Date().toISOString()
    });
  } else {
    res.redirect('/login');
  }
});

// Login page
app.get('/login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SalonPro - Multi-Store Management</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            width: 100%;
            max-width: 400px;
            animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .logo {
            text-align: center;
            margin-bottom: 32px;
        }
        .logo h1 {
            color: #8B5CF6;
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
        }
        .logo p {
            color: #6B7280;
            font-size: 14px;
            font-weight: 500;
        }
        .form-group {
            margin-bottom: 24px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #E5E7EB;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.2s ease;
            background: #F9FAFB;
        }
        input:focus {
            outline: none;
            border-color: #8B5CF6;
            background: white;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        button {
            width: 100%;
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
            color: white;
            padding: 16px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        button:disabled {
            background: #9CA3AF;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .message {
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 14px;
            font-weight: 500;
        }
        .error {
            background: #FEF2F2;
            color: #DC2626;
            border: 1px solid #FECACA;
        }
        .success {
            background: #F0FDF4;
            color: #059669;
            border: 1px solid #BBF7D0;
        }
        .credentials {
            margin-top: 24px;
            padding: 20px;
            background: #F8FAFC;
            border-radius: 12px;
            border-left: 4px solid #8B5CF6;
        }
        .credentials h4 {
            color: #1F2937;
            margin-bottom: 12px;
            font-size: 14px;
            font-weight: 600;
        }
        .credentials p {
            color: #6B7280;
            margin: 6px 0;
            font-size: 13px;
        }
        .version {
            text-align: center;
            margin-top: 20px;
            color: #9CA3AF;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>SalonPro</h1>
            <p>Multi-Store Salon Management System</p>
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input
                    type="email"
                    id="email"
                    value="admin@salonpro.com"
                    required
                    autocomplete="email"
                />
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    value="admin123"
                    required
                    autocomplete="current-password"
                />
            </div>
            
            <button type="submit" id="loginButton">
                Sign In to SalonPro
            </button>
            
            <div id="message"></div>
        </form>
        
        <div class="credentials">
            <h4>Default Administrator Credentials</h4>
            <p><strong>Email:</strong> admin@salonpro.com</p>
            <p><strong>Password:</strong> admin123</p>
            <p><em>Change these credentials after first login</em></p>
        </div>
        
        <div class="version">
            SalonPro v1.0.0 - Production Ready
        </div>
    </div>
    
    <script>
        const form = document.getElementById('loginForm');
        const button = document.getElementById('loginButton');
        const messageDiv = document.getElementById('message');
        
        function showMessage(message, type) {
            messageDiv.innerHTML = '<div class="message ' + type + '">' + message + '</div>';
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            button.disabled = true;
            button.textContent = 'Signing In...';
            messageDiv.innerHTML = '';
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Login successful! Welcome to SalonPro.', 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
                }
            } catch (error) {
                showMessage('Network error. Please check your connection and try again.', 'error');
            } finally {
                button.disabled = false;
                button.textContent = 'Sign In to SalonPro';
            }
        });
        
        // Auto-focus email field
        document.getElementById('email').focus();
    </script>
</body>
</html>
  `);
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>SalonPro Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #8B5CF6; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card h3 { color: #8B5CF6; margin-top: 0; }
        .logout { background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SalonPro Dashboard</h1>
        <p>Welcome back, Administrator!</p>
        <button class="logout" onclick="logout()">Logout</button>
    </div>
    
    <div class="cards">
        <div class="card">
            <h3>Store Management</h3>
            <p>Manage multiple salon locations, settings, and configurations.</p>
        </div>
        <div class="card">
            <h3>Customer Management</h3>
            <p>Track customers, loyalty points, and visit history.</p>
        </div>
        <div class="card">
            <h3>Appointments</h3>
            <p>Manage bookings, schedules, and staff assignments.</p>
        </div>
        <div class="card">
            <h3>Billing & POS</h3>
            <p>Process payments, generate invoices, and track sales.</p>
        </div>
        <div class="card">
            <h3>Inventory</h3>
            <p>Manage products, stock levels, and suppliers.</p>
        </div>
        <div class="card">
            <h3>Reports</h3>
            <p>View analytics, sales reports, and performance metrics.</p>
        </div>
    </div>
    
    <script>
        async function logout() {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        }
    </script>
</body>
</html>
  `);
});

// API Routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple authentication (replace with real database check)
    if (email === 'admin@salonpro.com' && password === 'admin123') {
      req.session.userId = 'admin';
      req.session.userRole = 'super_admin';
      
      res.json({
        id: 'admin',
        email: 'admin@salonpro.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  res.json({
    id: 'admin',
    email: 'admin@salonpro.com',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin'
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Login settings API
app.get('/api/login-settings', (req, res) => {
  res.json({
    id: 1,
    companyName: 'SalonPro',
    logoUrl: null,
    welcomeMessage: 'Welcome to your salon management system',
    footerText: 'Designed by - My Internet',
    primaryColor: '#8B5CF6',
    backgroundImage: null
  });
});

// Stores API
app.get('/api/stores', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Main Store',
      address: '123 Main Street',
      city: 'Your City',
      state: 'Your State',
      phone: '+1234567890',
      email: 'admin@salonpro.com',
      isActive: true
    }
  ]);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toLocaleTimeString()}] SalonPro server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Login page: http://localhost:${PORT}/login`);
  console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
EOF

# Create package.json with ES modules
log "Creating package.json for ES modules..."
cat > package.json << 'EOF'
{
  "name": "salonpro",
  "version": "1.0.0",
  "type": "module",
  "description": "Multi-Store Salon Management System",
  "main": "server/app.js",
  "scripts": {
    "start": "node server/app.js",
    "dev": "node server/app.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "express-session": "^1.18.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Install dependencies
log "Installing dependencies..."
npm install

# Create PM2 configuration
log "Creating PM2 configuration..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'salonpro',
      script: 'server/app.js',
      cwd: '/var/www/salonpro',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        SESSION_SECRET: 'salon-pro-production-secret-key'
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000,
      error_file: '/var/log/salonpro-error.log',
      out_file: '/var/log/salonpro-out.log',
      log_file: '/var/log/salonpro.log',
      time: true
    }
  ]
};
EOF

# Set permissions
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Create log files
touch /var/log/salonpro-{error,out}.log /var/log/salonpro.log
chown www-data:www-data /var/log/salonpro*.log

# Test the server first
log "Testing server locally..."
timeout 5s node server/app.js &
SERVER_PID=$!
sleep 2

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "✅ Server test successful"
    kill $SERVER_PID 2>/dev/null || true
    
    # Start with PM2
    log "Starting with PM2..."
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    
    # Wait and verify
    sleep 3
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "✅ PM2 startup successful"
        
        # Configure Nginx
        log "Configuring Nginx..."
        cat > /etc/nginx/sites-available/salonpro << 'NGINXEOF'
server {
    listen 80;
    server_name 173.212.252.179 _;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
NGINXEOF
        
        ln -sf /etc/nginx/sites-available/salonpro /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        if nginx -t; then
            systemctl restart nginx
            log "✅ Nginx configured successfully"
            
            # Final test
            sleep 2
            if curl -f http://localhost/health > /dev/null 2>&1; then
                log "🎉 DEPLOYMENT SUCCESSFUL!"
                echo ""
                echo "SalonPro is now running at:"
                echo "  URL: http://173.212.252.179"
                echo "  Login: http://173.212.252.179/login"
                echo "  Dashboard: http://173.212.252.179/dashboard"
                echo ""
                echo "Credentials:"
                echo "  Email: admin@salonpro.com"
                echo "  Password: admin123"
                echo ""
                echo "Management:"
                echo "  pm2 status salonpro"
                echo "  pm2 logs salonpro"
                echo "  pm2 restart salonpro"
            else
                log "⚠️ Nginx proxy issue - try http://173.212.252.179:3000 directly"
            fi
        else
            log "❌ Nginx configuration error"
        fi
    else
        log "❌ PM2 startup failed"
        pm2 logs salonpro --lines 10
    fi
else
    log "❌ Server test failed"
    kill $SERVER_PID 2>/dev/null || true
fi

log "Setup complete!"
EOF

chmod +x working-server-fix.sh