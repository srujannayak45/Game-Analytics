FROM eclipse-temurin:11-jre

# Install Python and dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Spark
RUN wget https://dlcdn.apache.org/spark/spark-3.5.0/spark-3.5.0-bin-hadoop3.tgz && \
    tar -xzf spark-3.5.0-bin-hadoop3.tgz && \
    mv spark-3.5.0-bin-hadoop3 /opt/spark && \
    rm spark-3.5.0-bin-hadoop3.tgz

ENV SPARK_HOME=/opt/spark
ENV PATH=$PATH:$SPARK_HOME/bin

WORKDIR /app

# Install Python dependencies
RUN pip3 install --no-cache-dir pyspark==3.5.0 redis==5.0.1 pandas==2.1.4

COPY fight_analytics.py .

CMD ["spark-submit", "--packages", "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0", "fight_analytics.py"]
