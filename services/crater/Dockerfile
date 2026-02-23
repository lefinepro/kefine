FROM crystallang/crystal:1.11.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY shard.yml shard.lock* ./
RUN shards install --production

# Copy source and build
COPY src ./src
RUN crystal build src/crater.cr -o crater --release --static

# --- Runtime stage ---
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/crater .

EXPOSE 3001

ENV PORT=3001
ENV CRYSTAL_ENV=production

CMD ["./crater"]
