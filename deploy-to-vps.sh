#!/bin/bash

# SalonPro Complete VPS Deployment Script
# Target: 173.212.252.179
# Usage: curl -sSL https://raw.githubusercontent.com/your-repo/salonpro/main/deploy-to-vps.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_IP="173.212.252.179"
PROJECT_NAME="salonpro"
PROJECT_DIR="/var/www/$PROJECT_NAME"
DB_NAME="salonpro"
DB_USER="salonpro_user"
DB_PASS="Veenails@2024!"
APP_PORT="3000"
DOMAIN=""  # Will be set later via subdomain

log() { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; }
warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    SalonPro VPS Deployment Script"
    echo "    Target IP: $VPS_IP"
    echo "=========================================="
    echo -e "${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        info "Please run: sudo $0"
        exit 1
    fi
}

# System update and preparation
prepare_system() {
    log "Preparing system..."
    export DEBIAN_FRONTEND=noninteractive
    
    # Update system
    apt update -y
    apt upgrade -y
    
    # Install essential packages
    apt install -y curl wget unzip git software-properties-common \
        build-essential python3 python3-pip nginx ufw htop nano vim
    
    log "System preparation completed"
}

# Install Node.js 20
install_nodejs() {
    log "Installing Node.js 20..."
    
    # Remove any existing Node.js
    apt remove -y nodejs npm 2>/dev/null || true
    
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Verify installation
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    PM2_VER=$(pm2 --version)
    
    log "Node.js: $NODE_VER, NPM: $NPM_VER, PM2: $PM2_VER"
}

# Install and configure PostgreSQL
setup_postgresql() {
    log "Installing PostgreSQL..."
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Configure PostgreSQL
    log "Configuring database..."
    
    sudo -u postgres psql << EOF
-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create new database and user
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER WITH SUPERUSER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;
EOF
    
    log "PostgreSQL configured successfully"
}

# Create project structure
create_project_structure() {
    log "Creating project structure..."
    
    # Remove existing directory if it exists
    rm -rf $PROJECT_DIR
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Create essential directories
    mkdir -p {client,server,shared,scripts,uploads}
    
    log "Project structure created at $PROJECT_DIR"
}

# Create package.json
create_package_json() {
    log "Creating package.json..."
    
    cat > $PROJECT_DIR/package.json << 'EOF'
{
  "name": "salonpro",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-accordion": "^1.2.4",
    "@radix-ui/react-alert-dialog": "^1.1.7",
    "@radix-ui/react-aspect-ratio": "^1.1.3",
    "@radix-ui/react-avatar": "^1.1.4",
    "@radix-ui/react-checkbox": "^1.1.5",
    "@radix-ui/react-collapsible": "^1.1.4",
    "@radix-ui/react-context-menu": "^2.2.7",
    "@radix-ui/react-dialog": "^1.1.7",
    "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-hover-card": "^1.1.7",
    "@radix-ui/react-label": "^2.1.3",
    "@radix-ui/react-menubar": "^1.1.7",
    "@radix-ui/react-navigation-menu": "^1.2.6",
    "@radix-ui/react-popover": "^1.1.7",
    "@radix-ui/react-progress": "^1.1.3",
    "@radix-ui/react-radio-group": "^1.2.4",
    "@radix-ui/react-scroll-area": "^1.2.4",
    "@radix-ui/react-select": "^2.1.7",
    "@radix-ui/react-separator": "^1.1.3",
    "@radix-ui/react-slider": "^1.2.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.1.4",
    "@radix-ui/react-tabs": "^1.1.4",
    "@radix-ui/react-toast": "^1.2.7",
    "@radix-ui/react-toggle": "^1.1.3",
    "@radix-ui/react-toggle-group": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@sendgrid/mail": "^8.1.5",
    "@tanstack/react-query": "^5.60.5",
    "bcrypt": "^6.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "connect-pg-simple": "^10.0.0",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "framer-motion": "^11.13.1",
    "jspdf": "^3.0.1",
    "lucide-react": "^0.453.0",
    "nanoid": "^5.1.5",
    "next-themes": "^0.4.6",
    "nodemailer": "^7.0.5",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "recharts": "^2.15.2",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "wouter": "^3.3.5",
    "ws": "^8.18.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/node": "20.16.11",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "esbuild": "^0.25.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.19"
  }
}
EOF
    
    log "Package.json created"
}

# Create environment configuration
create_environment() {
    log "Creating environment configuration..."
    
    cat > $PROJECT_DIR/.env.production << EOF
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASS
PGDATABASE=$DB_NAME
PORT=$APP_PORT
VITE_API_URL=http://$VPS_IP:$APP_PORT
EOF
    
    chmod 600 $PROJECT_DIR/.env.production
    log "Environment configuration created"
}

# Setup database schema and data
setup_database_schema() {
    log "Setting up database schema..."
    
    PGPASSWORD="$DB_PASS" psql -U $DB_USER -h localhost -d $DB_NAME << 'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  mobile VARCHAR,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'executive' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  description TEXT,
  gst_number VARCHAR,
  logo_url TEXT,
  enable_tax BOOLEAN DEFAULT true,
  tax_name VARCHAR DEFAULT 'GST',
  tax_rate REAL DEFAULT 18.00,
  is_active BOOLEAN DEFAULT true,
  theme_color VARCHAR DEFAULT '#8B5CF6',
  opening_time VARCHAR DEFAULT '09:00',
  closing_time VARCHAR DEFAULT '18:00',
  slot_duration INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store staff table
CREATE TABLE IF NOT EXISTS store_staff (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  role VARCHAR DEFAULT 'executive' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR,
  mobile VARCHAR NOT NULL,
  email VARCHAR,
  date_of_birth VARCHAR,
  gender VARCHAR,
  address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  category_id INTEGER REFERENCES service_categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Product categories
CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  category_id INTEGER REFERENCES product_categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  cost_price REAL DEFAULT 0,
  barcode VARCHAR,
  sku VARCHAR,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  customer_id INTEGER REFERENCES customers(id),
  customer_name VARCHAR,
  customer_mobile VARCHAR,
  customer_email VARCHAR,
  transaction_type VARCHAR DEFAULT 'sale',
  subtotal REAL NOT NULL,
  discount_amount REAL DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  paid_amount REAL DEFAULT 0,
  payment_method VARCHAR DEFAULT 'cash',
  payment_status VARCHAR DEFAULT 'pending',
  loyalty_points_earned INTEGER DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Login page settings
CREATE TABLE IF NOT EXISTS login_page_settings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR DEFAULT 'SalonPro',
  logo_url TEXT,
  welcome_message TEXT DEFAULT 'Welcome to your salon management system',
  footer_text TEXT DEFAULT 'Designed by - My Internet',
  primary_color VARCHAR DEFAULT '#8B5CF6',
  background_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial data
INSERT INTO stores (name, address, phone, email, city, state, zip_code, is_active) 
VALUES ('Main Store', '123 Main Street', '+1234567890', 'admin@salonpro.com', 'Your City', 'Your State', '12345', true)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, first_name, last_name, password, role, is_active) 
VALUES ('admin', 'admin@salonpro.com', 'Super', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewNhD/EpE5kxfx.6', 'super_admin', true)
ON CONFLICT DO NOTHING;

INSERT INTO service_categories (store_id, name, description) VALUES 
(1, 'Hair Services', 'All hair-related services'),
(1, 'Nail Services', 'Manicure and pedicure services'),
(1, 'Facial Services', 'Facial treatments and skincare'),
(1, 'Massage Services', 'Relaxation and therapeutic massage')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (store_id, name, description) VALUES 
(1, 'Hair Products', 'Shampoos, conditioners, styling products'),
(1, 'Nail Products', 'Nail polish, treatments, tools'),
(1, 'Skincare Products', 'Cleansers, moisturizers, treatments'),
(1, 'Tools & Equipment', 'Professional salon tools')
ON CONFLICT DO NOTHING;

INSERT INTO login_page_settings (company_name, welcome_message, footer_text, primary_color) 
VALUES ('SalonPro', 'Welcome to your salon management system', 'Designed by - My Internet', '#8B5CF6')
ON CONFLICT DO NOTHING;
EOF
    
    log "Database schema and initial data created"
}

# Install project dependencies
install_dependencies() {
    log "Installing project dependencies..."
    
    cd $PROJECT_DIR
    npm install --production=false
    
    log "Dependencies installed"
}

# Create PM2 ecosystem
create_pm2_config() {
    log "Creating PM2 configuration..."
    
    cat > $PROJECT_DIR/ecosystem.config.cjs << EOF
module.exports = {
  apps: [
    {
      name: '$PROJECT_NAME',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'development',
        PORT: $APP_PORT
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: $APP_PORT,
        DATABASE_URL: 'postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: '/var/log/$PROJECT_NAME-error.log',
      out_file: '/var/log/$PROJECT_NAME-out.log',
      log_file: '/var/log/$PROJECT_NAME.log'
    }
  ]
};
EOF
    
    log "PM2 configuration created"
}

# Configure Nginx
setup_nginx() {
    log "Configuring Nginx..."
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create SalonPro site configuration
    cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $VPS_IP _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Main application
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$APP_PORT/health;
        access_log off;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        proxy_pass http://localhost:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    
    # Test and restart Nginx
    nginx -t && systemctl restart nginx
    systemctl enable nginx
    
    log "Nginx configured and started"
}

# Configure firewall
setup_firewall() {
    log "Configuring firewall..."
    
    ufw --force reset
    ufw --force enable
    
    # Allow essential ports
    ufw allow ssh
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow $APP_PORT/tcp
    
    log "Firewall configured"
}

# Create management scripts
create_management_scripts() {
    log "Creating management scripts..."
    
    # Status check script
    cat > $PROJECT_DIR/status.sh << 'EOF'
#!/bin/bash
echo "=== SalonPro Status ==="
echo "Application Status:"
pm2 status salonpro
echo ""
echo "Database Status:"
systemctl status postgresql --no-pager -l
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l
echo ""
echo "System Resources:"
free -h
df -h /
EOF
    
    # Restart script
    cat > $PROJECT_DIR/restart.sh << 'EOF'
#!/bin/bash
echo "Restarting SalonPro..."
pm2 restart salonpro
systemctl restart nginx
echo "Restart completed"
EOF
    
    # Logs script
    cat > $PROJECT_DIR/logs.sh << 'EOF'
#!/bin/bash
echo "Recent application logs:"
pm2 logs salonpro --lines 50
EOF
    
    # Make scripts executable
    chmod +x $PROJECT_DIR/{status,restart,logs}.sh
    
    log "Management scripts created"
}

# Set proper permissions
set_permissions() {
    log "Setting proper permissions..."
    
    # Create www-data user if not exists
    id -u www-data &>/dev/null || useradd -r -s /bin/false www-data
    
    # Set ownership and permissions
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
    chmod 600 $PROJECT_DIR/.env.production
    
    # Create log directory
    mkdir -p /var/log
    touch /var/log/{$PROJECT_NAME-error.log,$PROJECT_NAME-out.log,$PROJECT_NAME.log}
    chown www-data:www-data /var/log/$PROJECT_NAME*.log
    
    log "Permissions set"
}

# Start application
start_application() {
    log "Starting SalonPro application..."
    
    cd $PROJECT_DIR
    
    # Load environment variables
    export NODE_ENV=production
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
    
    # Start with PM2
    pm2 delete $PROJECT_NAME 2>/dev/null || true
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    
    # Setup PM2 startup
    pm2 startup systemd -u root --hp /root
    
    log "Application started successfully"
}

# Health check
perform_health_check() {
    log "Performing health check..."
    
    sleep 5
    
    # Check if application is responding
    if curl -f http://localhost:$APP_PORT/health 2>/dev/null; then
        log "Application is responding correctly"
    else
        warning "Application health check failed"
    fi
    
    # Check PM2 status
    pm2 status $PROJECT_NAME
}

# Show completion message
show_completion() {
    echo ""
    echo -e "${GREEN}=========================================="
    echo "    SalonPro Deployment Completed!"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${BLUE}Server Information:${NC}"
    echo "  IP Address: $VPS_IP"
    echo "  Application URL: http://$VPS_IP"
    echo "  Port: $APP_PORT"
    echo ""
    echo -e "${BLUE}Login Credentials:${NC}"
    echo "  Email: admin@salonpro.com"
    echo "  Password: admin123"
    echo ""
    echo -e "${BLUE}Database Information:${NC}"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  Password: $DB_PASS"
    echo ""
    echo -e "${BLUE}Management Commands:${NC}"
    echo "  Status: $PROJECT_DIR/status.sh"
    echo "  Restart: $PROJECT_DIR/restart.sh"
    echo "  Logs: $PROJECT_DIR/logs.sh"
    echo "  PM2 Status: pm2 status"
    echo "  PM2 Logs: pm2 logs $PROJECT_NAME"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  1. Access your application: http://$VPS_IP"
    echo "  2. Login with the provided credentials"
    echo "  3. Change the admin password"
    echo "  4. Configure your subdomain to point to $VPS_IP"
    echo ""
    echo -e "${GREEN}Deployment successful! 🎉${NC}"
}

# Main execution
main() {
    show_banner
    check_root
    prepare_system
    install_nodejs
    setup_postgresql
    create_project_structure
    create_package_json
    create_environment
    setup_database_schema
    install_dependencies
    create_pm2_config
    setup_nginx
    setup_firewall
    create_management_scripts
    set_permissions
    start_application
    perform_health_check
    show_completion
}

# Execute main function
main "$@"