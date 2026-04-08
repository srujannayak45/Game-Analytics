#!/bin/bash

# Fight Analytics - Quick Deployment Script
# For Ubuntu/Debian servers

set -e

echo "🚀 Fight Analytics Deployment Starting..."
echo "==========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run as root (sudo ./deploy.sh)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    rm get-docker.sh
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
sleep 30

# Create Kafka topic
echo "📊 Creating Kafka topic..."
docker exec fight-kafka kafka-topics --create \
    --topic fight-events \
    --bootstrap-server localhost:9092 \
    --partitions 2 \
    --replication-factor 1 \
    --if-not-exists

# Check service status
echo ""
echo "✅ Deployment Complete!"
echo "==========================================="
echo "Services Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🎮 Access your application:"
echo "   Game: http://$(hostname -I | awk '{print $1}'):3000"
echo "   Dashboard: http://$(hostname -I | awk '{print $1}'):3000/dashboard.html"
echo "   Backend API: http://$(hostname -I | awk '{print $1}'):8000/docs"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop all: docker-compose -f docker-compose.prod.yml down"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🎉 Enjoy your Fighting Tiger game!"
