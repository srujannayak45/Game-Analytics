# 🚀 Quick Start Guide - Fight Analytics

## Every Time You Want to Play

### Step 1: Start Docker (PowerShell - Windows)
```powershell
cd C:\Users\sruja\OneDrive\Documents\game-anlaytics
docker-compose up -d
```
**Wait 10 seconds** ⏱️ for Kafka/Redis to initialize.

---

### Step 2: Start Backend (WSL Terminal 1)
```bash
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics/backend
source ../backend_env/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
**Wait for:** ✅ `FastAPI backend started successfully`

---

### Step 3: Start Spark Analytics (WSL Terminal 2)
```bash
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics
source spark_env/bin/activate
spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 spark/fight_analytics.py
```
**Wait for:** ✅ `Spark Streaming job started. Listening for fight events...`

---

### Step 4: Start Frontend (PowerShell - Windows)
```powershell
cd C:\Users\sruja\OneDrive\Documents\game-anlaytics\frontend
npm start
```
**Wait for:** ✅ `Compiled successfully!`

---

### Step 5: Play! 🎮
Open **http://localhost:3000** in your browser

**Controls:**
- **A** = Punch (10 damage)
- **S** = Kick (15 damage)
- **D** = Heavy Punch (20 damage)
- **W** = Block (50% damage reduction)

---

## ⚡ Super Quick Order Summary

1. **Docker** (Windows PowerShell) - `docker-compose up -d`
2. **Backend** (WSL) - `uvicorn main:app --reload --host 0.0.0.0 --port 8000`
3. **Spark** (WSL) - `spark-submit ...`
4. **Frontend** (Windows PowerShell) - `npm start`
5. **Browser** - http://localhost:3000

---

## 🛑 To Stop Everything

**Close all terminals** (Ctrl+C), then:

```powershell
docker-compose down
```

---

## ✅ Verify Everything is Running

```bash
# Check Docker containers
docker ps
# Should show: kafka, zookeeper, redis

# Check Backend
curl http://localhost:8000/api/dashboard
# Should return JSON

# Check Frontend
# Browser at http://localhost:3000 should load
```

---

## 💡 Pro Tips

- **Keep Docker running** in the background - it uses minimal resources
- **Backend & Spark** can be restarted without restarting Docker
- **Frontend** hot-reloads automatically when you edit code
- **Dashboard** updates every 1 second automatically
- Press **Reset Game** button to clear all stats and start fresh

---

## 📊 Watch the Magic

As you fight:
1. **Game** sends moves to Backend
2. **Backend** publishes to Kafka
3. **Spark** processes in 3-second batches
4. **Spark** writes stats to Redis
5. **Dashboard** polls and updates every second

**Complete real-time analytics pipeline!** 🚀
