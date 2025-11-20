# 1) Tải node và pack
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build Next.js
RUN npm run db:generate
RUN npm run build

# 3) Runtime (production)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Entrypoint to run Prisma migrations before start
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# App files for runtime
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000
ENV PORT=3000

# Start (via entrypoint to run migrations first)
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start"]