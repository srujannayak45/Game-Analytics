import json
import threading
import os
from collections import deque
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from confluent_kafka import Producer, Consumer, KafkaError
except Exception:
    Producer = None
    Consumer = None
    KafkaError = None

try:
    import redis
except Exception:
    redis = None

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
APP_MODE = os.getenv('APP_MODE', 'local').lower()
kafka_producer = None
redis_client = None
event_log = deque(maxlen=200)
state_lock = threading.Lock()
live_summary = {
    'player1': {
        'total_damage': 0,
        'hp_remaining': 100,
        'move_counts': {'punch': 0, 'kick': 0, 'heavy': 0, 'block': 0},
        'most_used_move': 'none',
        'hits_landed': 0,
        'blocks_used': 0,
        'round_count': 1
    },
    'ai': {
        'total_damage': 0,
        'hp_remaining': 100,
        'move_counts': {'punch': 0, 'kick': 0, 'heavy': 0, 'block': 0},
        'most_used_move': 'none',
        'hits_landed': 0,
        'blocks_used': 0,
        'round_count': 1
    }
}


def _new_summary():
    return {
        'player1': {
            'total_damage': 0,
            'hp_remaining': 100,
            'move_counts': {'punch': 0, 'kick': 0, 'heavy': 0, 'block': 0},
            'most_used_move': 'none',
            'hits_landed': 0,
            'blocks_used': 0,
            'round_count': 1
        },
        'ai': {
            'total_damage': 0,
            'hp_remaining': 100,
            'move_counts': {'punch': 0, 'kick': 0, 'heavy': 0, 'block': 0},
            'most_used_move': 'none',
            'hits_landed': 0,
            'blocks_used': 0,
            'round_count': 1
        }
    }


def _update_live_summary(summary, move_data):
    player_id = 'player1' if move_data.get('player_id') == 'player1' else 'ai'
    opponent_id = 'ai' if player_id == 'player1' else 'player1'
    move = str(move_data.get('move', 'punch'))
    damage = int(move_data.get('damage', 0) or 0)
    round_num = int(move_data.get('round_num', 1) or 1)

    actor = summary[player_id]
    opponent = summary[opponent_id]

    actor['round_count'] = max(actor.get('round_count', 1), round_num)
    opponent['round_count'] = max(opponent.get('round_count', 1), round_num)

    if move not in actor['move_counts']:
        actor['move_counts'][move] = 0
    actor['move_counts'][move] += 1

    if move == 'block':
        actor['blocks_used'] += 1

    actor['total_damage'] += max(damage, 0)
    if damage > 0:
        actor['hits_landed'] += 1

    if actor['move_counts']:
        actor['most_used_move'] = max(actor['move_counts'], key=actor['move_counts'].get)
        if actor['move_counts'][actor['most_used_move']] == 0:
            actor['most_used_move'] = 'none'

    if 'attacker_hp' in move_data:
        actor['hp_remaining'] = max(0, min(100, int(move_data['attacker_hp'])))
    if 'defender_hp' in move_data:
        opponent['hp_remaining'] = max(0, min(100, int(move_data['defender_hp'])))


def _persist_state():
    if redis_client is None:
        return

    try:
        redis_client.set('match_summary', json.dumps(live_summary))
        redis_client.delete('event_log')
        if event_log:
            redis_client.rpush('event_log', *[json.dumps(e) for e in event_log])
            redis_client.ltrim('event_log', -200, -1)
    except Exception as e:
        print(f'Redis persist error: {e}')


def _load_state_from_redis():
    if redis_client is None:
        return

    try:
        match_summary_str = redis_client.get('match_summary')
        if match_summary_str:
            data = json.loads(match_summary_str)
            if isinstance(data, dict):
                live_summary['player1'].update(data.get('player1', {}))
                live_summary['ai'].update(data.get('ai', {}))

        event_log_list = redis_client.lrange('event_log', 0, -1)
        if event_log_list:
            event_log.clear()
            for item in event_log_list[-200:]:
                event_log.append(json.loads(item))
    except Exception as e:
        print(f'Redis load error: {e}')

def kafka_consumer_thread():
    """Background thread to consume Kafka messages and store in event_log"""
    if Consumer is None or KafkaError is None:
        print('Kafka client unavailable, skipping consumer thread')
        return

    consumer = Consumer({
        'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
        'group.id': 'dashboard-group',
        'auto.offset.reset': 'latest'
    })
    
    consumer.subscribe([os.getenv('KAFKA_TOPIC', 'fight-events')])
    
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
            with state_lock:
                event_log.append(value)
                _update_live_summary(live_summary, value)
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
    
    if APP_MODE == 'serverless':
        print('Serverless mode active, using in-memory backend state')
        return

    if redis is not None:
        try:
            redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', '6379')),
                decode_responses=True
            )
            redis_client.ping()
            _load_state_from_redis()
            print('Connected to Redis')
        except Exception as e:
            redis_client = None
            print(f'Redis unavailable, continuing without persistence: {e}')

    if Producer is not None:
        try:
            kafka_producer = Producer({
                'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'),
                'client.id': 'fight-analytics-producer'
            })

            consumer_thread = threading.Thread(target=kafka_consumer_thread, daemon=True)
            consumer_thread.start()
            print('Connected to Kafka')
        except Exception as e:
            kafka_producer = None
            print(f'Kafka unavailable, continuing without Kafka: {e}')

    print("FastAPI backend started successfully")

@app.post("/api/move")
async def handle_move(move_data: Dict[str, Any]):
    """
    Accept move event and publish to Kafka
    Expected fields: player_id, move, damage, is_blocked, attacker_hp, defender_hp, round_num, timestamp
    """
    if APP_MODE == 'serverless' or kafka_producer is None:
        with state_lock:
            event_log.append(move_data)
            _update_live_summary(live_summary, move_data)
            _persist_state()
        return {"status": "ok"}

    kafka_producer.produce(
        os.getenv('KAFKA_TOPIC', 'fight-events'),
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
        if redis_client is not None:
            match_summary_str = redis_client.get('match_summary')
            match_summary = json.loads(match_summary_str) if match_summary_str else None
            
            event_log_list = redis_client.lrange('event_log', 0, -1)
            event_log_data = [json.loads(e) for e in event_log_list] if event_log_list else []
        else:
            match_summary = None
            event_log_data = []

        if not match_summary:
            with state_lock:
                match_summary = json.loads(json.dumps(live_summary))
                if not event_log_data:
                    event_log_data = list(event_log)
        
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
        if redis_client is not None:
            redis_client.delete('match_summary')
            redis_client.delete('event_log')
        with state_lock:
            event_log.clear()
            live_summary.clear()
            live_summary.update(_new_summary())
        return {"status": "reset"}
    except Exception as e:
        print(f"Error resetting: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
