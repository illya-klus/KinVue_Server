# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared && pnpm --filter @kinvue/gateway build
RUN pnpm --filter @kinvue/gateway deploy --prod --legacy /out

FROM node:24-bookworm-slim
RUN addgroup --system kinvue && adduser --system --ingroup kinvue kinvue
WORKDIR /app/services/gateway
COPY --from=build --chown=kinvue:kinvue /out /app/services/gateway
COPY --from=build --chown=kinvue:kinvue /repo/packages/shared-protos/proto /app/packages/shared-protos/proto
USER kinvue
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/main.js"]
