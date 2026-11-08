# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
RUN apk add --no-cache ffmpeg
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY services/transcode-worker ./services/transcode-worker
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @kinvue/transcode-worker build

FROM node:24-alpine AS production
RUN apk add --no-cache ffmpeg
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate
RUN addgroup -g 1001 kinvue && adduser -u 1001 -G kinvue -D kinvue
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/services/transcode-worker/dist ./services/transcode-worker/dist
COPY --from=build /app/services/transcode-worker/package.json ./services/transcode-worker/
WORKDIR /app/services/transcode-worker
USER kinvue
ENV NODE_ENV=production
EXPOSE 4016
CMD ["node", "dist/main.js"]
