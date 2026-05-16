FROM crystallang/crystal:1.11.2

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends zstd \
  && rm -rf /var/lib/apt/lists/*

COPY crater/shard.yml crater/shard.lock* ./
RUN shards install

EXPOSE 3001

CMD ["crystal", "run", "src/crater.cr"]
