# Multi-stage Dockerfile for NextGenGames.gg & Board Brawl
# Optimized for Proxmox LXC / Docker VM

# Stage 1: Dependencies & Build
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/app/data
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/components ./components
COPY --from=builder /app/app ./app
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Persistent data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 3000

CMD ["node", "server.js"]
