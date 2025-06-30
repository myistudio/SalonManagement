# SalonPro - Localhost Setup Guide

## Prerequisites

Before starting, ensure you have these installed on your computer:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL** (version 12 or higher)
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: Use Homebrew `brew install postgresql` or download from official site
   - Ubuntu/Linux: `sudo apt-get install postgresql postgresql-contrib`

3. **Git** (to download the project)
   - Download from: https://git-scm.com/

## Step 1: Download the Project

1. Create a folder on your computer for the project:
   ```bash
   mkdir salon-management
   cd salon-management
   ```

2. Copy all project files to this folder (or clone from repository if available)

## Step 2: Install Dependencies

1. Open terminal/command prompt in the project folder
2. Install all required packages:
   ```bash
   npm install
   ```

## Step 3: Database Setup

### 3.1 Start PostgreSQL Service

**Windows:**
- PostgreSQL should start automatically after installation
- Or use Services app to start "postgresql" service

**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.2 Create Database and User

1. Access PostgreSQL as superuser:
   ```bash
   # Windows/Linux
   psql -U postgres
   
   # macOS (if using homebrew)
   psql postgres
   ```

2. Create database and user:
   ```sql
   CREATE DATABASE salon_db;
   CREATE USER salon_user WITH PASSWORD 'salon_password_123';
   GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;
   \q
   ```

### 3.3 Test Database Connection

```bash
psql -U salon_user -d salon_db -h localhost
```
If this works, type `\q` to exit.

## Step 4: Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your database details:
   ```env
   DATABASE_URL=postgresql://salon_user:salon_password_123@localhost:5432/salon_db
   SESSION_SECRET=your_very_long_random_secret_key_at_least_32_characters_long
   NODE_ENV=development
   PORT=5000
   ```

## Step 5: Initialize Database Schema

Run this command to create all database tables:
```bash
npm run db:push
```

## Step 6: Start the Application

### Development Mode (Recommended for local testing)
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Step 7: Access the Application

1. Open your web browser
2. Go to: `http://localhost:5000`
3. You should see the login page

## Step 8: Create Admin Account

The system comes with a default admin account:
- **Email:** admin@salon.com
- **Password:** admin123

You can also create a new admin account by running:
```bash
node server/create-admin.js
```

## Troubleshooting

### Database Connection Issues

1. **"Connection refused"**
   - Ensure PostgreSQL is running
   - Check if port 5432 is available: `netstat -an | grep 5432`

2. **"Authentication failed"**
   - Verify username and password in `.env` file
   - Ensure user has proper permissions

3. **"Database does not exist"**
   - Make sure you created the database: `CREATE DATABASE salon_db;`

### Application Issues

1. **Port already in use**
   - Change PORT in `.env` to different number (e.g., 3000, 8080)
   - Or stop the service using that port

2. **Permission errors**
   - Run terminal as administrator (Windows)
   - Use `sudo` for commands (Linux/macOS)

3. **Missing dependencies**
   - Delete `node_modules` folder and `package-lock.json`
   - Run `npm install` again

### Performance Tips

1. **For better performance:**
   - Close other applications
   - Use Chrome or Firefox browser
   - Ensure at least 4GB RAM available

2. **For development:**
   - Use `npm run dev` for auto-reload
   - Check browser console for errors (F12)

## Default Data

The system includes sample data for testing:
- 3 stores (Elite Nail Studio, Royal Beauty Lounge, VEEPRESS)
- 9 sample customers with loyalty points
- 10 products with stock levels
- 11 services across different categories

## Features Available

Once running, you can:
- Create and manage customers
- Process billing with barcode scanning
- Manage inventory and stock
- Generate reports and analytics
- Set up WhatsApp integration
- Manage multiple stores
- Print thermal receipts
- Handle membership programs

## Security Notes

For production deployment:
1. Change default admin password
2. Use strong database passwords
3. Set secure SESSION_SECRET
4. Enable HTTPS
5. Configure firewall properly

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for errors
2. Look at terminal output for error messages
3. Verify all prerequisites are installed correctly
4. Ensure database is running and accessible