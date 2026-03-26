#!/bin/bash

# Docker deployment script for HommesEstates Backend

set -e

echo "🚀 Starting HommesEstates Backend Deployment..."

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

# Create necessary directories
echo "📁 Creating storage directories..."
mkdir -p storage/documents storage/images storage/temp ssl

# Generate self-signed SSL certificate if not exists
if [ ! -f "ssl/cert.pem" ]; then
    echo "🔐 Generating self-signed SSL certificate..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
        -subj "/C=NG/ST=Abuja/L=Abuja/O=HommesEstates/CN=localhost"
fi

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend python -m alembic upgrade head

# Check health
echo "🏥 Checking health endpoints..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed"
fi

if curl -f http://localhost:6379 > /dev/null 2>&1; then
    echo "✅ Redis is healthy!"
else
    echo "❌ Redis health check failed"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "  - Backend API: http://localhost:8000"
echo "  - API Documentation: http://localhost:8000/docs"
echo "  - Redis: localhost:6379"
echo "  - Nginx (HTTPS): https://localhost"
echo ""
echo "🔧 Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Access backend shell: docker-compose exec backend bash"
echo ""
echo "📝 Next steps:"
echo "  1. Update environment variables in docker-compose.yml"
echo "  2. Replace self-signed certificates with production certificates"
echo "  3. Configure proper domain names in nginx.conf"
echo "  4. Set up proper backup strategies"
