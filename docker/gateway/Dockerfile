# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY services/gateway ./services/gateway
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @kinvue/contracts build
RUN pnpm --filter @kinvue/gateway build

FROM node:24-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate
RUN addgroup -g 1001 kinvue && adduser -u 1001 -G kinvue -D kinvue
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/services/gateway/dist ./services/gateway/dist
COPY --from=build /app/services/gateway/package.json ./services/gateway/
WORKDIR /app/services/gateway
USER kinvue
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/main.js"]
