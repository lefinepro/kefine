FROM crystallang/crystal:1.16.3

WORKDIR /app

COPY crater/shard.yml crater/shard.lock* ./
RUN shards install

EXPOSE 3001

CMD ["crystal", "run", "src/crater.cr"]
