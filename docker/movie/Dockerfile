FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared && pnpm --filter @kinvue/movie build
RUN pnpm --filter @kinvue/movie deploy --prod --legacy /out

FROM node:24-bookworm-slim
ENV NODE_ENV=production MOVIE_HTTP_HOST=0.0.0.0 MOVIE_HTTP_PORT=4003
WORKDIR /app
COPY --from=build --chown=node:node /out /app
USER node
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+(process.env.MOVIE_HTTP_PORT||4003)+'/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
