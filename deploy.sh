#!/bin/bash

# Deathroll WoW Production Deployment Script

echo "🎮 Starting Deathroll WoW Production Deployment..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Install server dependencies if needed
echo "📦 Installing server dependencies..."
cd server
npm install --production
cd ..

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop deathroll-wow || echo "No existing process to stop"
pm2 delete deathroll-wow || echo "No existing process to delete"

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 process list
echo "💾 Saving PM2 process list..."
pm2 save

# Setup PM2 startup (run this manually if needed)
echo "⚙️  To setup auto-startup, run: pm2 startup"

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed!"
echo "🌐 Your Deathroll WoW server should now be running on port 3040"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status          - Show all processes"
echo "  pm2 logs            - Show all logs"
echo "  pm2 restart all     - Restart all processes"
echo "  pm2 stop all        - Stop all processes"
echo "  pm2 monit           - Monitor processes"
