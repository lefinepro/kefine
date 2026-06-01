FROM crystallang/crystal:1.16.3

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends zstd \
  && rm -rf /var/lib/apt/lists/*

COPY crater/shard.yml crater/shard.lock* ./
COPY scripts/patch-rcl-crystal-merge.sh /tmp/patch-rcl-crystal-merge.sh
RUN shards install \
  && /tmp/patch-rcl-crystal-merge.sh /app/lib/rcl/src/rcl/document.cr


EXPOSE 3001

CMD ["crystal", "run", "src/crater.cr"]
