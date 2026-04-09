from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, window, to_timestamp
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, BooleanType, DoubleType
import redis
import json

# Initialize Spark Session
spark = SparkSession.builder \
    .appName("FightAnalytics") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

# Initialize Redis
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Define schema for fight events
schema = StructType([
    StructField("player_id", StringType(), True),
    StructField("move", StringType(), True),
    StructField("damage", IntegerType(), True),
    StructField("is_blocked", BooleanType(), True),
    StructField("attacker_hp", IntegerType(), True),
    StructField("defender_hp", IntegerType(), True),
    StructField("round_num", IntegerType(), True),
    StructField("timestamp", DoubleType(), True)
])


def default_match_summary():
    return {
        "player1": {
            "total_damage": 0,
            "hp_remaining": 100,
            "move_counts": {"punch": 0, "kick": 0, "heavy": 0, "block": 0},
            "most_used_move": "none",
            "hits_landed": 0,
            "blocks_used": 0,
            "round_count": 1
        },
        "ai": {
            "total_damage": 0,
            "hp_remaining": 100,
            "move_counts": {"punch": 0, "kick": 0, "heavy": 0, "block": 0},
            "most_used_move": "none",
            "hits_landed": 0,
            "blocks_used": 0,
            "round_count": 1
        }
    }


def load_summary_from_redis():
    stored = redis_client.get('match_summary')
    if not stored:
        return default_match_summary()

    try:
        summary = json.loads(stored)
        base = default_match_summary()
        for player_id in ['player1', 'ai']:
            player_summary = summary.get(player_id, {}) if isinstance(summary, dict) else {}
            base[player_id].update(player_summary)
            base[player_id]['move_counts'].update(player_summary.get('move_counts', {}))
        if isinstance(summary, dict) and 'winner' in summary:
            base['winner'] = summary['winner']
        else:
            base['winner'] = None
        return base
    except Exception:
        return default_match_summary()

# Read from Kafka
df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "fight-events") \
    .option("startingOffsets", "latest") \
    .load()

# Parse JSON
parsed_df = df.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# Convert timestamp to event_time
parsed_df = parsed_df.withColumn("event_time", to_timestamp(col("timestamp")))

# Apply watermark and window
windowed_df = parsed_df \
    .withWatermark("event_time", "3 seconds") \
    .groupBy(window(col("event_time"), "5 seconds"))

def process_batch(batch_df, batch_id):
    """
    Process each micro-batch using pandas
    """
    if batch_df.isEmpty():
        return
    
    # Convert to pandas
    pdf = batch_df.toPandas()
    
    if len(pdf) == 0:
        return
    
    print(f"\n=== Processing Batch {batch_id} with {len(pdf)} events ===")
    
    match_summary = load_summary_from_redis()
    existing_events = redis_client.lrange('event_log', 0, -1)
    event_log_data = [json.loads(e) for e in existing_events] if existing_events else []
    
    # Group by player
    for player_id in ['player1', 'ai']:
        player_events = pdf[pdf['player_id'] == player_id]
        
        if len(player_events) == 0:
            continue
        
        opponent_id = 'ai' if player_id == 'player1' else 'player1'
        player_summary = match_summary[player_id]
        
        # Total damage dealt
        total_damage = int(player_events['damage'].sum())
        player_summary['total_damage'] += total_damage
        
        # Move counts
        for move_type in ['punch', 'kick', 'heavy', 'block']:
            count = int(len(player_events[player_events['move'] == move_type]))
            player_summary['move_counts'][move_type] = player_summary['move_counts'].get(move_type, 0) + count
        
        # Most used move
        move_counts = player_summary['move_counts']
        if sum(move_counts.values()) > 0:
            most_used = max(move_counts, key=move_counts.get)
            player_summary['most_used_move'] = most_used
        
        # Hits landed (non-zero damage moves)
        hits_landed = int(len(player_events[(player_events['damage'] > 0) & (player_events['move'] != 'block')]))
        player_summary['hits_landed'] += hits_landed
        
        # Blocks used
        blocks_used = int(len(player_events[player_events['move'] == 'block']))
        player_summary['blocks_used'] += blocks_used
        
        # Round count
        round_count = int(player_events['round_num'].max()) if len(player_events) > 0 else 1
        player_summary['round_count'] = max(player_summary.get('round_count', 1), round_count)
    
    # Calculate HP remaining from the LATEST event for each player
    # Get the most recent HP for each player from the events
    latest_player1_event = pdf[pdf['player_id'] == 'player1'].sort_values('timestamp', ascending=False)
    latest_ai_event = pdf[pdf['player_id'] == 'ai'].sort_values('timestamp', ascending=False)
    
    # Player1's HP is shown in attacker_hp when they attack
    if len(latest_player1_event) > 0:
        match_summary['player1']['hp_remaining'] = int(latest_player1_event.iloc[0]['attacker_hp'])
    
    # AI's HP is shown in attacker_hp when AI attacks  
    if len(latest_ai_event) > 0:
        match_summary['ai']['hp_remaining'] = int(latest_ai_event.iloc[0]['attacker_hp'])
    
    # Also check defender_hp to see if someone was knocked out
    # When player1 attacks, defender_hp shows AI's HP
    player1_attacks = pdf[pdf['player_id'] == 'player1'].sort_values('timestamp', ascending=False)
    if len(player1_attacks) > 0:
        match_summary['ai']['hp_remaining'] = int(player1_attacks.iloc[0]['defender_hp'])
    
    # When AI attacks, defender_hp shows Player1's HP
    ai_attacks = pdf[pdf['player_id'] == 'ai'].sort_values('timestamp', ascending=False)
    if len(ai_attacks) > 0:
        match_summary['player1']['hp_remaining'] = int(ai_attacks.iloc[0]['defender_hp'])
    
    # Detect winner (K.O.)
    winner = None
    if match_summary['ai']['hp_remaining'] <= 0:
        winner = "PLAYER 1"
        match_summary['winner'] = "player1"
    elif match_summary['player1']['hp_remaining'] <= 0:
        winner = "AI"
        match_summary['winner'] = "ai"
    else:
        match_summary['winner'] = None
    
    # Write match_summary to Redis
    redis_client.set('match_summary', json.dumps(match_summary))
    
    # Append raw events to Redis list
    for _, row in pdf.iterrows():
        event_data = {
            "player_id": row['player_id'],
            "move": row['move'],
            "damage": int(row['damage']),
            "is_blocked": bool(row['is_blocked']),
            "attacker_hp": int(row['attacker_hp']),
            "defender_hp": int(row['defender_hp']),
            "round_num": int(row['round_num']),
            "timestamp": float(row['timestamp'])
        }
        event_log_data.append(event_data)
        redis_client.rpush('event_log', json.dumps(event_data))
    
    # Keep only last 100 events
    redis_client.ltrim('event_log', -100, -1)
    
    # Print summary
    print(f"Match Summary:")
    print(f"  Player 1: {match_summary['player1']['total_damage']} damage, {match_summary['player1']['hp_remaining']} HP, {match_summary['player1']['most_used_move']} most used")
    print(f"  AI: {match_summary['ai']['total_damage']} damage, {match_summary['ai']['hp_remaining']} HP, {match_summary['ai']['most_used_move']} most used")
    if winner:
        print(f"  🏆 WINNER: {winner} 🏆")
    print("="*60)

# Start streaming query
query = parsed_df \
    .writeStream \
    .outputMode("update") \
    .foreachBatch(process_batch) \
    .trigger(processingTime="3 seconds") \
    .start()

# Also write to console for visibility
console_query = parsed_df \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .trigger(processingTime="3 seconds") \
    .start()

print("Spark Streaming job started. Listening for fight events...")

query.awaitTermination()
