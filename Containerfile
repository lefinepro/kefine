FROM oven/bun:1.2.23 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.2.23

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/kefine.config.json ./kefine.config.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

EXPOSE 5173

CMD ["bun", "build/index.js"]
