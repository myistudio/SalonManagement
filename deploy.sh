#!/bin/bash

# Salon Management System Deployment Script
set -e

echo "🏪 Deploying Salon Management System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
    echo "   - Set DATABASE_URL and POSTGRES_PASSWORD"
    echo "   - Generate a secure SESSION_SECRET"
    echo "   - Configure your domain in REPLIT_DOMAINS"
    read -p "Press Enter to continue after editing .env file..."
fi

# Create SSL directory if it doesn't exist
if [ ! -d "ssl" ]; then
    echo "🔐 Creating SSL directory..."
    mkdir -p ssl
    echo "⚠️  Please add your SSL certificates to the ssl/ directory:"
    echo "   - ssl/cert.pem (certificate file)"
    echo "   - ssl/key.pem (private key file)"
    echo ""
    echo "   For Let's Encrypt certificates, you can use:"
    echo "   sudo certbot certonly --standalone -d your-domain.com"
    echo "   then copy the files from /etc/letsencrypt/live/your-domain.com/"
fi

# Build and start the services
echo "🔨 Building application..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Setting up database schema..."
docker-compose exec app npm run db:push

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Your application is running at: https://your-domain.com"
echo "2. Check logs with: docker-compose logs -f"
echo "3. Stop services with: docker-compose down"
echo "4. View running services: docker-compose ps"
echo ""
echo "🔧 Useful commands:"
echo "   - Restart application: docker-compose restart app"
echo "   - View app logs: docker-compose logs -f app"
echo "   - Access database: docker-compose exec postgres psql -U salon_user salon_db"
echo "   - Backup database: docker-compose exec postgres pg_dump -U salon_user salon_db > backup.sql"