#!/bin/bash

# ================================================
#   FIGHT ANALYTICS - COMPLETE STARTUP
# ================================================

echo "================================================"
echo "  FIGHT ANALYTICS - Starting All Services"
echo "================================================"
echo

# Navigate to project directory
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics

# Function to check if service is running
check_service() {
    echo -n "  Checking $1... "
    if $2; then
        echo "✓ Running"
        return 0
    else
        echo "✗ Not running"
        return 1
    fi
}

# Check prerequisites
echo "[1/5] Checking prerequisites..."
check_service "Docker" "docker ps > /dev/null 2>&1"
check_service "Kafka topic" "docker exec kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null | grep -q fight-events"

# Setup virtual environments if needed
echo
echo "[2/5] Setting up Python environments..."
if [ ! -d "backend_env" ]; then
    echo "  Creating backend_env..."
    python3 -m venv backend_env
    source backend_env/bin/activate
    pip install -q -r requirements.txt
    deactivate
    echo "  ✓ Backend environment created"
else
    echo "  ✓ Backend environment exists"
fi

if [ ! -d "spark_env" ]; then
    echo "  Creating spark_env..."
    python3 -m venv spark_env
    source spark_env/bin/activate
    pip install -q pyspark pandas redis
    deactivate
    echo "  ✓ Spark environment created"
else
    echo "  ✓ Spark environment exists"
fi

echo
echo "[3/5] Ready to start services!"
echo
echo "================================================"
echo "  OPTION 1: Start All Services in Background"
echo "================================================"
read -p "Start backend and Spark now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Start backend in background
    echo "  Starting backend..."
    source backend_env/bin/activate
    cd backend
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "  ✓ Backend started (PID: $BACKEND_PID)"
    cd ..
    deactivate
    
    # Start Spark in background
    echo "  Starting Spark..."
    source spark_env/bin/activate
    nohup spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 spark/fight_analytics.py > logs/spark.log 2>&1 &
    SPARK_PID=$!
    echo "  ✓ Spark started (PID: $SPARK_PID)"
    deactivate
    
    echo
    echo "================================================"
    echo "  ALL SERVICES RUNNING!"
    echo "================================================"
    echo "  Backend PID: $BACKEND_PID"
    echo "  Spark PID:   $SPARK_PID"
    echo
    echo "  View logs:"
    echo "    Backend: tail -f logs/backend.log"
    echo "    Spark:   tail -f logs/spark.log"
    echo
    echo "  Stop services:"
    echo "    kill $BACKEND_PID $SPARK_PID"
    echo "================================================"
else
    echo
    echo "================================================"
    echo "  OPTION 2: Start Manually in Separate Terminals"
    echo "================================================"
    echo
    echo "  TERMINAL 1 - Backend:"
    echo "    cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics"
    echo "    source backend_env/bin/activate"
    echo "    cd backend"
    echo "    uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo
    echo "  TERMINAL 2 - Spark:"
    echo "    cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics"
    echo "    source spark_env/bin/activate"
    echo "    spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 spark/fight_analytics.py"
    echo "================================================"
fi

echo
echo "[4/5] Access URLs:"
echo "  🎮 Game:      http://localhost:3000"
echo "  📊 Dashboard: http://localhost:3000/dashboard.html"
echo "  🔧 API Docs:  http://localhost:8000/docs"
echo
echo "[5/5] Setup complete!"
echo "================================================"
