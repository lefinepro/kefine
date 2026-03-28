FROM oven/bun:1.2.23 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM caddy:2.10-alpine

WORKDIR /app

RUN apk add --no-cache nodejs

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY Caddyfile /etc/caddy/Caddyfile

ENV NODE_ENV=production
ENV PORT=5173
ENV ORIGIN=http://localhost:5173
ENV APP_PORT=3000

EXPOSE 5173

CMD ["sh", "-c", "HOST=127.0.0.1 PORT=${APP_PORT} ORIGIN=${ORIGIN} node build & exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]


