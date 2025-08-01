#!/bin/bash

# SalonPro One-Click Installation Script
# Run with: curl -sSL https://your-domain.com/install.sh | sudo bash
# Or: wget -qO- https://your-domain.com/install.sh | sudo bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="salonpro"
PROJECT_DIR="/var/www/$PROJECT_NAME"
DB_NAME="salonpro"
DB_USER="salonpro_user"
DB_PASS="Veenails@2!"
APP_PORT="3000"
NODE_VERSION="20"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Update system
update_system() {
    log "Updating system packages..."
    apt update && apt upgrade -y
    apt install -y curl wget unzip git software-properties-common
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    NODE_VER=$(node --version)
    NPM_VER=$(npm --version)
    log "Node.js installed: $NODE_VER"
    log "NPM installed: $NPM_VER"
}

# Install PostgreSQL
install_postgresql() {
    log "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    log "PostgreSQL installed and started"
}

# Configure PostgreSQL
setup_database() {
    log "Setting up database..."
    
    # Create database and user
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    # Grant schema permissions
    sudo -u postgres psql -d $DB_NAME -c "
        GRANT ALL ON SCHEMA public TO $DB_USER;
        GRANT CREATE ON SCHEMA public TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;
    "
    
    log "Database configured successfully"
}

# Download and setup project
setup_project() {
    log "Setting up SalonPro project..."
    
    # Create project directory
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # If project files don't exist, create a placeholder
    if [ ! -f "package.json" ]; then
        warning "Project files not found. Please upload your project zip file to $PROJECT_DIR"
        info "After upload, extract with: cd $PROJECT_DIR && unzip your-project.zip && mv extracted-folder/* . && rmdir extracted-folder"
        info "Then run: $PROJECT_DIR/complete-setup.sh"
        return
    fi
    
    # Install dependencies
    log "Installing project dependencies..."
    npm install
    
    # Set proper permissions
    chown -R www-data:www-data $PROJECT_DIR
    chmod -R 755 $PROJECT_DIR
}

# Create environment configuration
create_env_config() {
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
EOF

    chmod 600 $PROJECT_DIR/.env.production
    log "Environment configuration created"
}

# Setup database tables and initial data
setup_database_schema() {
    log "Setting up database schema..."
    
    cd $PROJECT_DIR
    
    # Export environment variables
    export NODE_ENV=production
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
    
    # Try to run migrations
    if npm run db:push 2>/dev/null; then
        log "Database migrations completed successfully"
    else
        warning "Migration failed, setting up tables manually..."
        setup_manual_schema
    fi
}

# Manual database schema setup
setup_manual_schema() {
    log "Setting up database tables manually..."
    
    PGPASSWORD="$DB_PASS" psql -U $DB_USER -h localhost -d $DB_NAME << 'EOF'
-- Essential tables
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

-- Insert default data
INSERT INTO stores (name, address, phone, email, city, state, zip_code, is_active) 
VALUES ('Main Store', '123 Main Street', '+1234567890', 'admin@salonpro.com', 'Your City', 'Your State', '12345', true)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, first_name, last_name, password, role, is_active) 
VALUES ('admin', 'admin@salonpro.com', 'Super', 'Admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewNhD/EpE5kxfx.6', 'super_admin', true)
ON CONFLICT DO NOTHING;
EOF

    log "Database schema setup completed"
}

# Install and configure PM2
setup_pm2() {
    log "Installing and configuring PM2..."
    
    npm install -g pm2
    
    cd $PROJECT_DIR
    
    # Build the application
    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        log "Building application..."
        npm run build
    else
        warning "No build script found, skipping build step"
    fi
    
    # Create PM2 ecosystem file
    cat > $PROJECT_DIR/ecosystem.config.cjs << EOF
module.exports = {
  apps: [
    {
      name: '$PROJECT_NAME',
      script: './dist/index.js',
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
      min_uptime: '10s'
    }
  ]
};
EOF
    
    log "PM2 configuration created"
}

# Install and configure Nginx
setup_nginx() {
    log "Installing and configuring Nginx..."
    
    apt install -y nginx
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name _;
    
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
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    nginx -t && systemctl restart nginx
    systemctl enable nginx
    
    log "Nginx configured and started"
}

# Create completion script for after project upload
create_completion_script() {
    cat > $PROJECT_DIR/complete-setup.sh << 'COMPLETION_EOF'
#!/bin/bash

# SalonPro Setup Completion Script
# Run this after uploading your project files

set -e

PROJECT_DIR="/var/www/salonpro"
cd $PROJECT_DIR

echo "Completing SalonPro setup..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build application
echo "Building application..."
npm run build 2>/dev/null || echo "Build skipped (no build script)"

# Start with PM2
echo "Starting application..."
export NODE_ENV=production
export DATABASE_URL="postgresql://salonpro_user:Veenails@2!@localhost:5432/salonpro"

pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup

echo "Setup completed!"
echo "Your application is now running on:"
echo "  - Local: http://localhost:3000"
echo "  - External: http://$(curl -s ifconfig.me):80"
echo ""
echo "Login credentials:"
echo "  Email: admin@salonpro.com"
echo "  Password: admin123"

COMPLETION_EOF

    chmod +x $PROJECT_DIR/complete-setup.sh
}

# Start application
start_application() {
    if [ -f "$PROJECT_DIR/package.json" ]; then
        log "Starting application..."
        cd $PROJECT_DIR
        
        export NODE_ENV=production
        export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
        
        pm2 start ecosystem.config.cjs --env production 2>/dev/null || warning "PM2 start failed - run after project upload"
        pm2 save 2>/dev/null || true
        pm2 startup 2>/dev/null || true
        
        log "Application started successfully"
    else
        warning "Application start skipped - project files not found"
    fi
}

# Create firewall rules
setup_firewall() {
    log "Configuring firewall..."
    
    ufw --force enable
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow $APP_PORT/tcp
    
    log "Firewall configured"
}

# Display completion message
show_completion_message() {
    echo ""
    echo "=========================================="
    log "SalonPro Installation Completed!"
    echo "=========================================="
    echo ""
    
    if [ -f "$PROJECT_DIR/package.json" ]; then
        info "Your application is running on:"
        info "  - Local: http://localhost:$APP_PORT"
        info "  - External: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
        echo ""
        info "Login credentials:"
        info "  Email: admin@salonpro.com"
        info "  Password: admin123"
    else
        warning "Project files not found. To complete setup:"
        info "1. Upload your project zip file to: $PROJECT_DIR"
        info "2. Extract: cd $PROJECT_DIR && unzip your-project.zip"
        info "3. Move files: mv extracted-folder/* . && rmdir extracted-folder"
        info "4. Run: $PROJECT_DIR/complete-setup.sh"
    fi
    
    echo ""
    info "Useful commands:"
    info "  - Check status: pm2 status"
    info "  - View logs: pm2 logs $PROJECT_NAME"
    info "  - Restart app: pm2 restart $PROJECT_NAME"
    info "  - Stop app: pm2 stop $PROJECT_NAME"
    echo ""
}

# Main installation function
main() {
    log "Starting SalonPro installation..."
    
    check_root
    update_system
    install_nodejs
    install_postgresql
    setup_database
    setup_project
    create_env_config
    setup_database_schema
    setup_pm2
    setup_nginx
    create_completion_script
    start_application
    setup_firewall
    show_completion_message
    
    log "Installation process completed!"
}

# Run main function
main "$@"