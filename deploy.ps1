# Windows Deployment Script
# Run this in PowerShell as Administrator

Write-Host "🚀 Fight Analytics - Windows Docker Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n🐳 Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green

# Stop any existing containers
Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null

# Build images
Write-Host "`n🏗️  Building Docker images..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

# Start services
Write-Host "`n🚀 Starting services..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services!" -ForegroundColor Red
    exit 1
}

# Wait for Kafka
Write-Host "`n⏳ Waiting for Kafka to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Create Kafka topic
Write-Host "`n📊 Creating Kafka topic..." -ForegroundColor Yellow
docker exec fight-kafka kafka-topics --create `
    --topic fight-events `
    --bootstrap-server localhost:9092 `
    --partitions 2 `
    --replication-factor 1 `
    --if-not-exists

# Show service status
Write-Host "`n✅ Deployment Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "`nServices Status:" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*","Wi-Fi*" | Select-Object -First 1).IPAddress

Write-Host "`n🎮 Access your application:" -ForegroundColor Cyan
Write-Host "   Game: http://localhost:3000" -ForegroundColor White
Write-Host "   Dashboard: http://localhost:3000/dashboard.html" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000/docs" -ForegroundColor White

if ($localIP) {
    Write-Host "`n🌐 Network Access:" -ForegroundColor Cyan
    Write-Host "   Game: http://${localIP}:3000" -ForegroundColor White
    Write-Host "   Dashboard: http://${localIP}:3000/dashboard.html" -ForegroundColor White
}

Write-Host "`n📋 Useful commands:" -ForegroundColor Yellow
Write-Host "   View logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "   Stop all: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
Write-Host "   Restart: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White

Write-Host "`n🎉 Enjoy your Fighting Tiger game!" -ForegroundColor Green
