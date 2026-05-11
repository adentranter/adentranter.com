FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Runtime markdown content used by fs.readFile()
COPY --from=builder /app/src/app/essays/content ./src/app/essays/content

# Runtime permissions
RUN mkdir -p /app/.next/cache/images \
  && chown -R nextjs:nextjs /app/.next \
  && chown -R nextjs:nextjs /app/src/app/essays/content

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
