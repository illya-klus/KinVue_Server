FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared && pnpm --filter @kinvue/rooms build
RUN pnpm --filter @kinvue/rooms deploy --prod --legacy /out

FROM node:24-bookworm-slim
ENV NODE_ENV=production ROOMS_HTTP_HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /out /app
USER node
EXPOSE 4004 4014
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4004/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
