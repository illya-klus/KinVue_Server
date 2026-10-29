FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared && pnpm --filter @kinvue/auth build
RUN pnpm --filter @kinvue/auth deploy --prod --legacy /out

FROM node:24-bookworm-slim
ENV NODE_ENV=production AUTH_HTTP_HOST=0.0.0.0 AUTH_HTTP_PORT=4001
WORKDIR /app
COPY --from=build --chown=node:node /out /app
USER node
EXPOSE 4001 50051
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4001/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
