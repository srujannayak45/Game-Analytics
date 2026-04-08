# ⚔️ Fight Analytics

**A professional browser-based fighting game with real-time big data analytics**

Every game move streams through Apache Kafka, gets processed by Spark Structured Streaming, and displays on a live analytics dashboard with modern, professional UI.

## ✨ Key Features

### 🎮 Fighting Game
- **Realistic Fighter Graphics** - Detailed 3D-style fighters with urban street background
- **Modern Click Controls** - 4 action buttons with professional styling
  - 👊 **PUNCH** - 10 damage - quick jab attack
  - 🦵 **KICK** - 15 damage - powerful leg strike  
  - 💥 **HEAVY** - 20 damage - devastating combo with screen flash
  - 🛡️ **BLOCK** - reduces incoming damage by 50%
- **Smart AI Opponent** - Intelligent counter-attacks with varied moves
- **Visual Effects** - Hit sparks, screen flashes, smooth animations
- **Professional UI** - Gradient buttons, hover effects, clean design

### 📊 Analytics Dashboard
- **Real-time Updates** - Live Kafka event streaming (1-second refresh)
- **Professional Design** - Glassmorphism, Inter font, smooth animations
- **Player Statistics** - Damage dealt, HP remaining, favorite moves
- **Event Stream** - Live event log with 20 most recent actions
- **Winner Detection** - Gold victory banner on K.O.
- **Big Data Pipeline** - Kafka → Spark → Redis → Dashboard


## 🚀 Quick Start (Windows + WSL)

### **Option 1: Automated Startup (Recommended)**

**On Windows, run:**
```batch
START.bat
```

This will automatically:
1. ✓ Start Docker services (Kafka, Zookeeper, Redis)
2. ✓ Create Kafka topic `fight-events`
3. ✓ Launch frontend in new window
4. ✓ Display backend/Spark commands

**Then in WSL, open TWO terminals:**

**Terminal 1 - Backend:**
```bash
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics
source backend_env/bin/activate
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Spark Analytics:**
```bash
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics
source spark_env/bin/activate
spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 spark/fight_analytics.py
```

**Access the app:**
- 🎮 **Game**: http://localhost:3000
- 📊 **Dashboard**: http://localhost:3000/dashboard.html
- 🔧 **API**: http://localhost:8000/docs

### **Option 2: Manual Setup**

1. **Start Docker:**
```bash
docker-compose up -d
```

2. **Create Kafka topic:**
```bash
docker exec -it kafka kafka-topics --create --topic fight-events --bootstrap-server localhost:9092 --partitions 2 --replication-factor 1 --if-not-exists
```

3. **Setup Python environments (WSL):**
```bash
cd /mnt/c/Users/sruja/OneDrive/Documents/game-anlaytics
bash setup_complete.sh
```

4. **Start services** (same as Option 1 - Backend and Spark in WSL)

5. **Start Frontend (Windows):**
```bash
cd frontend
npm start
```

### Step 4: Start Spark Streaming Job
Open a new terminal:
```bash
cd backend
venv\Scripts\activate
cd ..
spark-submit --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0 spark/fight_analytics.py
```

### Step 5: Start React Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```

### Step 6: Play!
Open http://localhost:3000

**Controls:**
- **A** - Punch (10 damage)
- **S** - Kick (15 damage)
- **D** - Heavy Punch (20 damage)
- **W** - Block (reduces incoming damage by 50%)

## Features

- Classic 2D fighting game mechanics
- Real-time Kafka event streaming
- Spark Structured Streaming analytics
- Live dashboard with move statistics
- HP tracking and damage calculations

## Tech Stack

- **Frontend**: React, HTML5 Canvas
- **Backend**: FastAPI
- **Message Queue**: Apache Kafka 7.5.0
- **Stream Processing**: Apache Spark 3.5.0
- **Cache**: Redis 7.2
- **Orchestration**: Docker Compose

## 🚀 Production Deployment

### Quick Deploy (One Command)
```bash
sudo ./deploy.sh
```

### Docker Compose Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Full Deployment Guide
See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete instructions:
- Cloud VM deployment (AWS, DigitalOcean, Azure)
- Docker containerization
- Systemd services
- Nginx reverse proxy
- SSL certificates
- Cost estimates

### Deployment Files
- `backend/Dockerfile` - Backend container
- `spark/Dockerfile` - Spark container
- `frontend/Dockerfile` - Frontend container
- `docker-compose.prod.yml` - Production compose
- `deploy.sh` - One-click deployment script

**Deploy to:**
- AWS EC2 (~$30/month)
- DigitalOcean Droplets (~$24/month)
- Any Ubuntu/Debian server

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Local development setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[NEW_UI_CHANGES.md](./NEW_UI_CHANGES.md)** - Fighting Tiger UI redesign
- **[WINNER_DETECTION_FIX.md](./WINNER_DETECTION_FIX.md)** - K.O. detection fix
- **[READY_TO_DEPLOY.md](./READY_TO_DEPLOY.md)** - Deployment summary

## 🎯 Game Controls

**Button Controls (Click to Attack):**
- 👊 PUNCH - 10 damage
- 🦵 KICK - 15 damage
- 💥 HEAVY - 20 damage (screen flash!)
- 🛡️ BLOCK - reduces incoming damage by 50%

**No keyboard required!** Pure click-based Fighting Tiger style gameplay.

## 📊 Analytics Features

- **Real-time Stats** - Damage dealt, HP remaining, move counts
- **Winner Detection** - K.O. detection with winner banner
- **Live Event Stream** - Last 20 actions with emojis
- **Move Distribution** - Most used moves per player
- **Spark Processing** - 3-second micro-batches
- **Auto-updates** - Dashboard refreshes every 1 second

## 🏆 K.O. System

When a player's HP reaches 0:
- Spark detects K.O. and identifies winner
- Dashboard shows winner banner (green for Player 1, red for AI)
- Spark console prints: `🏆 WINNER: PLAYER 1 🏆`
- Match statistics freeze at K.O. moment

## 🐳 Architecture

```
Frontend (React) → Backend (FastAPI) → Kafka Topic → Spark Streaming → Redis → Dashboard
                                         ↓
                                    Analytics
```

## 🤝 Contributing

This project was built as a demonstration of real-time analytics with Kafka and Spark. Feel free to fork and customize!

## 📄 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ using Apache Kafka, Spark, and React**

🥊 Fight! 📊 Analyze! 🚀 Deploy!
#
