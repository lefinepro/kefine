FROM node:20-alpine AS build

WORKDIR /app

COPY package.json .yarnrc.yml ./
RUN corepack enable && yarn install

COPY . .
RUN yarn build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/kefine.config.json ./kefine.config.json
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=5173
ENV HOST=0.0.0.0

EXPOSE 5173

CMD ["node", "build/index.js"]
