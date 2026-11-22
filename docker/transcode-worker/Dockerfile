# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
RUN apk add --no-cache ffmpeg
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY services/transcode-worker ./services/transcode-worker
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared && pnpm --filter @kinvue/transcode-worker build
RUN pnpm --filter @kinvue/transcode-worker deploy --prod --legacy /out

FROM node:24-alpine AS production
RUN apk add --no-cache ffmpeg
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate
RUN addgroup -g 1001 kinvue && adduser -u 1001 -G kinvue -D kinvue
WORKDIR /app
COPY --from=build --chown=kinvue:kinvue /out /app
USER kinvue
ENV NODE_ENV=production
EXPOSE 4016
CMD ["node", "dist/main.js"]
