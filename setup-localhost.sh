#!/bin/bash

# SalonPro Localhost Setup Script
echo "🏪 SalonPro - Localhost Setup Script"
echo "===================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Windows: https://www.postgresql.org/download/windows/"
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    
    # Generate a random session secret
    SESSION_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    # Update .env with localhost database URL
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=postgresql://salon_user:salon_password_123@localhost:5432/salon_db|g" .env
    sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|g" .env
    sed -i.bak "s|NODE_ENV=.*|NODE_ENV=development|g" .env
    
    echo "✅ Environment file created"
else
    echo "✅ Environment file already exists"
fi

# Create database setup SQL
echo "📝 Creating database setup script..."
cat > setup_database.sql << EOF
-- Create database and user for SalonPro
CREATE DATABASE salon_db;
CREATE USER salon_user WITH PASSWORD 'salon_password_123';
GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;
ALTER USER salon_user CREATEDB;
EOF

echo "🗄️ Database setup instructions:"
echo "1. Run: psql -U postgres"
echo "2. Execute: \\i setup_database.sql"
echo "3. Exit: \\q"
echo ""
echo "Or run this command to setup database:"
echo "psql -U postgres -f setup_database.sql"
echo ""

# Ask user if they want to proceed with database setup
read -p "Do you want to attempt automatic database setup? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗄️ Setting up database..."
    
    # Try to create database automatically
    psql -U postgres -f setup_database.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database setup completed"
        
        # Initialize database schema
        echo "📊 Initializing database schema..."
        npm run db:push
        
        if [ $? -eq 0 ]; then
            echo "✅ Database schema initialized"
        else
            echo "❌ Failed to initialize database schema"
            echo "Please run: npm run db:push"
        fi
    else
        echo "❌ Database setup failed. Please setup manually:"
        echo "1. psql -U postgres"
        echo "2. CREATE DATABASE salon_db;"
        echo "3. CREATE USER salon_user WITH PASSWORD 'salon_password_123';"
        echo "4. GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;"
        echo "5. \\q"
        echo "6. npm run db:push"
    fi
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then open your browser to: http://localhost:5000"
echo ""
echo "Default login credentials:"
echo "  Email: admin@salon.com"
echo "  Password: admin123"
echo ""
echo "For detailed setup instructions, see: LOCALHOST_SETUP.md"