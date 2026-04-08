#!/bin/bash

echo "=========================================="
echo " COMPLETE SETUP & DEPLOYMENT"
echo "=========================================="
echo

# Step 1: Rename dashboard
echo "[1/6] Updating dashboard..."
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics/frontend/public
mv dashboard.html dashboard_old.html 2>/dev/null
mv dashboard_new.html dashboard.html 2>/dev/null
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics
echo "✓ Dashboard updated with professional design"

# Step 2: Create virtual environments if they don't exist
echo
echo "[2/6] Setting up Python virtual environments..."
if [ ! -d "backend_env" ]; then
  python3 -m venv backend_env
  source backend_env/bin/activate
  pip install -r requirements.txt
  deactivate
  echo "✓ Backend environment created"
else
  echo "✓ Backend environment exists"
fi

if [ ! -d "spark_env" ]; then
  python3 -m venv spark_env
  source spark_env/bin/activate
  pip install pyspark pandas redis
  deactivate
  echo "✓ Spark environment created"
else
  echo "✓ Spark environment exists"
fi

# Step 3: Create Kafka topic
echo
echo "[3/6] Creating Kafka topic..."
docker exec kafka kafka-topics --create --topic fight-events --bootstrap-server localhost:9092 --partitions 2 --replication-factor 1 --if-not-exists 2>/dev/null
if [ $? -eq 0 ]; then
  echo "✓ Kafka topic 'fight-events' created/verified"
else
  echo "⚠ Kafka topic creation failed (may already exist or docker not running)"
fi

# Step 4: Test Kafka connectivity
echo
echo "[4/6] Testing Kafka connectivity..."
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092 2>/dev/null | grep fight-events
if [ $? -eq 0 ]; then
  echo "✓ Kafka topic verified and accessible"
else
  echo "✗ Warning: Cannot verify Kafka topic"
fi

echo
echo "[5/6] Installation complete!"
echo
echo "=========================================="
echo " STARTUP INSTRUCTIONS"
echo "=========================================="
echo
echo "Run these commands in SEPARATE WSL terminals:"
echo
echo "TERMINAL 1 - Backend:"
echo "  cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics"
echo "  source backend_env/bin/activate"
echo "  cd backend"
echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo
echo "TERMINAL 2 - Spark Analytics:"
echo "  cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics"
echo "  source spark_env/bin/activate"
echo "  spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 spark/fight_analytics.py"
echo
echo "=========================================="
echo " ACCESS URLs"
echo "=========================================="
echo "  Game:      http://localhost:3000"
echo "  Dashboard: http://localhost:3000/dashboard.html"
echo "  Backend:   http://localhost:8000"
echo "=========================================="
echo
echo "[6/6] Ready to start! Run the commands above."
