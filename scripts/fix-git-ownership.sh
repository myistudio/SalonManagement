#!/bin/bash

# Fix Git ownership issues for SalonPro deployment
APP_DIR="/var/www/salonpro"

echo "🔧 Fixing Git ownership issues..."

# Add safe directory to Git configuration
sudo git config --global --add safe.directory $APP_DIR

# Fix ownership of the directory
sudo chown -R $(whoami):$(whoami) $APP_DIR/.git 2>/dev/null || true

echo "✅ Git ownership fixed!"

# Now try to update the repository
cd $APP_DIR
if [ -d ".git" ]; then
    echo "🔄 Updating repository..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
    echo "✅ Repository updated successfully!"
else
    echo "❌ Not a Git repository"
fi