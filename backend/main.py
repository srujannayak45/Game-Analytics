from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from confluent_kafka import Producer, Consumer, KafkaError
import redis
import json
import time
import threading
from collections import deque
from typing import Dict, Any

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
kafka_producer = None
redis_client = None
event_log = deque(maxlen=200)

def kafka_consumer_thread():
    """Background thread to consume Kafka messages and store in event_log"""
    consumer = Consumer({
        'bootstrap.servers': 'localhost:9092',
        'group.id': 'dashboard-group',
        'auto.offset.reset': 'latest'
    })
    
    consumer.subscribe(['fight-events'])
    
    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Consumer error: {msg.error()}")
                    continue
            
            value = json.loads(msg.value().decode('utf-8'))
            event_log.append(value)
    except Exception as e:
        print(f"Consumer thread error: {e}")
    finally:
        consumer.close()

def delivery_report(err, msg):
    """Kafka delivery callback"""
    if err is not None:
        print(f'Message delivery failed: {err}')

@app.on_event("startup")
async def startup_event():
    global kafka_producer, redis_client
    
    # Initialize Kafka Producer
    kafka_producer = Producer({
        'bootstrap.servers': 'localhost:9092',
        'client.id': 'fight-analytics-producer'
    })
    
    # Initialize Redis
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )
    
    # Start Kafka consumer in background thread
    consumer_thread = threading.Thread(target=kafka_consumer_thread, daemon=True)
    consumer_thread.start()
    
    print("FastAPI backend started successfully")

@app.post("/api/move")
async def handle_move(move_data: Dict[str, Any]):
    """
    Accept move event and publish to Kafka
    Expected fields: player_id, move, damage, is_blocked, attacker_hp, defender_hp, round_num, timestamp
    """
    kafka_producer.produce(
        'fight-events',
        value=json.dumps(move_data).encode('utf-8'),
        callback=delivery_report
    )
    kafka_producer.flush()
    return {"status": "ok"}

@app.get("/api/dashboard")
async def get_dashboard():
    """
    Read match summary and event log from Redis
    """
    try:
        match_summary_str = redis_client.get('match_summary')
        match_summary = json.loads(match_summary_str) if match_summary_str else {}
        
        event_log_list = redis_client.lrange('event_log', 0, -1)
        event_log_data = [json.loads(e) for e in event_log_list] if event_log_list else []
        
        return {
            "match_summary": match_summary,
            "event_log": event_log_data
        }
    except Exception as e:
        print(f"Error reading from Redis: {e}")
        return {
            "match_summary": {},
            "event_log": []
        }

@app.get("/api/events")
async def get_events():
    """
    Return last 50 events from in-memory event_log
    """
    events = list(event_log)[-50:]
    return {"events": events}

@app.post("/api/reset")
async def reset_game():
    """
    Reset the game by clearing Redis and event_log
    """
    try:
        redis_client.delete('match_summary')
        redis_client.delete('event_log')
        event_log.clear()
        return {"status": "reset"}
    except Exception as e:
        print(f"Error resetting: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
