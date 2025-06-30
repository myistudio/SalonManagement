# Quick Start Guide - SalonPro Localhost

## Super Simple Setup (5 minutes)

### 1. Install Requirements
- **Node.js 18+**: Download from nodejs.org
- **PostgreSQL**: Download from postgresql.org

### 2. Setup Database
Open terminal and run:
```bash
# Login to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE salon_db;
CREATE USER salon_user WITH PASSWORD 'salon_password_123';
GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;
\q
```

### 3. Setup Project
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Initialize database
npm run db:push

# Start application
npm run dev
```

### 4. Access Application
Open browser: `http://localhost:5000`

**Login with:**
- Email: `admin@salon.com`
- Password: `admin123`

## Automated Setup (Recommended)

### Windows Users:
```bash
setup-localhost.bat
```

### Mac/Linux Users:
```bash
chmod +x setup-localhost.sh
./setup-localhost.sh
```

## Troubleshooting

**Database connection error?**
- Make sure PostgreSQL is running
- Check username/password in .env file

**Port 5000 already in use?**
- Change PORT=3000 in .env file

**Installation failed?**
- Delete node_modules folder
- Run `npm install` again

## What's Included

After setup, you get a complete salon management system with:
- Customer management with loyalty points
- Product inventory with barcode scanning
- Service booking and billing
- Multi-store management
- Reports and analytics
- WhatsApp integration
- Thermal receipt printing
- Staff management with roles

## Sample Data

The system includes demo data:
- 3 stores ready to use
- 9 sample customers
- 10 products with stock
- 11 different services
- Sample transactions and reports

## Need Help?

Check the detailed guide: `LOCALHOST_SETUP.md`