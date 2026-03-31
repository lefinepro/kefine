FROM crystallang/crystal:1.16.3

WORKDIR /app

COPY crater/shard.yml crater/shard.lock* ./
RUN shards install

COPY crater/src ./src
COPY kefine.config.json ./kefine.config.json
RUN crystal build src/crater.cr -o crater --release

EXPOSE 3001

CMD ["./crater"]
