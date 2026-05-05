FROM crystallang/crystal:1.16.3

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends zstd \
  && rm -rf /var/lib/apt/lists/*

COPY crater/shard.yml crater/shard.lock* ./
COPY crater/lib/rcl /tmp/kefine-rcl
RUN sed -i 's|path: .*|path: /tmp/kefine-rcl|' shard.yml
RUN shards install

EXPOSE 3001

CMD ["crystal", "run", "src/crater.cr"]
