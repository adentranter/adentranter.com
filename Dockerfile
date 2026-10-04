FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
# NEXT_PUBLIC_* values are inlined into the client bundle, so they must be set at build time.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER
ARG NEXT_PUBLIC_SNES_HOST
ARG NEXT_PUBLIC_SNES_PROTOCOL
ARG NEXT_PUBLIC_SNES_PORT
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY \
    NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER \
    NEXT_PUBLIC_SNES_HOST=$NEXT_PUBLIC_SNES_HOST \
    NEXT_PUBLIC_SNES_PROTOCOL=$NEXT_PUBLIC_SNES_PROTOCOL \
    NEXT_PUBLIC_SNES_PORT=$NEXT_PUBLIC_SNES_PORT
ENV NEXT_TELEMETRY_DISABLED=1
# Cap the heap so V8 collects before the kernel OOM-kills the build (exit 137).
ENV NODE_OPTIONS="--max-old-space-size=1536"
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
