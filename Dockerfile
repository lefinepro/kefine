FROM oven/bun:1.2.23

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

ENV NODE_ENV=production
ENV PORT=5173

EXPOSE 5173

CMD ["bun", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
