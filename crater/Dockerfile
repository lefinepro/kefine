FROM crystallang/crystal:1.16.3

WORKDIR /app

COPY shard.yml shard.lock* ./
RUN shards install

COPY src ./src
RUN crystal build src/crater.cr -o crater --release

EXPOSE 3001
ENV PORT=3001
ENV CRYSTAL_ENV=production

CMD ["./crater"]
