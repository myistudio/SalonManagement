# SalonPro One-Click Installation

This guide provides multiple ways to deploy your SalonPro application on a VPS server.

## 🚀 Method 1: One-Click Install Script

### Option A: Download and Run
```bash
# Download the installation script
wget https://raw.githubusercontent.com/your-repo/salonpro/main/install.sh

# Make it executable
chmod +x install.sh

# Run the installation
sudo ./install.sh
```

### Option B: Direct Execute
```bash
# Run directly from URL (when hosted)
curl -sSL https://your-domain.com/install.sh | sudo bash
```

### Option C: Local Install
```bash
# If you have the install.sh file locally
sudo bash install.sh
```

## 📦 Method 2: Manual Upload and Install

### Step 1: Prepare Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget unzip nodejs npm postgresql postgresql-contrib nginx
```

### Step 2: Upload Project
```bash
# Create project directory
sudo mkdir -p /var/www/salonpro
cd /var/www/salonpro

# Upload your project zip file here (via SCP, FTP, or web interface)
# Then extract it:
sudo unzip salonpro.zip
sudo mv salonpro-main/* . || mv salonpro/* . || echo "Adjust path as needed"
```

### Step 3: Run Quick Setup
```bash
# Make setup script executable
sudo chmod +x /var/www/salonpro/install.sh

# Run the installer
sudo /var/www/salonpro/install.sh
```

## 🛠️ Method 3: Docker Deployment (Alternative)

### Create Docker Setup
```bash
# Create docker-compose.yml in your project directory
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://salonpro_user:Veenails@2!@db:5432/salonpro
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=salonpro
      - POSTGRES_USER=salonpro_user
      - POSTGRES_PASSWORD=Veenails@2!
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Run with Docker
docker-compose up -d
```

## 🔧 Post-Installation

### Default Login Credentials
- **Email**: admin@salonpro.com
- **Password**: admin123

### Useful Commands
```bash
# Check application status
pm2 status

# View application logs
pm2 logs salonpro

# Restart application
pm2 restart salonpro

# Stop application
pm2 stop salonpro

# Check database connection
PGPASSWORD='Veenails@2!' psql -U salonpro_user -h localhost -d salonpro -c "SELECT version();"
```

### Accessing Your Application
- **Local**: http://localhost:3000
- **External**: http://YOUR_SERVER_IP
- **With Domain**: http://your-domain.com (after DNS setup)

## 🔒 Security Recommendations

### 1. Change Default Passwords
```bash
# Change database password
sudo -u postgres psql -c "ALTER USER salonpro_user PASSWORD 'your-new-strong-password';"

# Update environment files with new password
sudo nano /var/www/salonpro/.env.production
```

### 2. Set Up SSL/HTTPS
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 3. Configure Firewall
```bash
# Enable UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check database exists
sudo -u postgres psql -l | grep salonpro
```

#### 2. Application Won't Start
```bash
# Check Node.js version
node --version  # Should be v20.x

# Check dependencies
cd /var/www/salonpro && npm install

# Check environment variables
cat /var/www/salonpro/.env.production
```

#### 3. Permission Issues
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/salonpro
sudo chmod -R 755 /var/www/salonpro
```

#### 4. Port Already in Use
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000

# Kill process if needed
sudo pkill -f "node.*3000"
```

### Getting Help
- Check logs: `pm2 logs salonpro`
- Monitor system: `htop` or `top`
- Database logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`

## 📝 Project Structure
```
/var/www/salonpro/
├── install.sh              # One-click installer
├── complete-setup.sh       # Post-upload completion script
├── ecosystem.config.cjs    # PM2 configuration
├── .env.production        # Environment variables
├── package.json           # Node.js dependencies
├── dist/                  # Built application
└── ...                    # Other project files
```

## 🎯 Success Indicators
- ✅ Application accessible at http://YOUR_SERVER_IP
- ✅ Can login with admin@salonpro.com / admin123
- ✅ Database connection working
- ✅ PM2 shows app as "online"
- ✅ Nginx serving the application

Your SalonPro application should now be fully deployed and ready for use!