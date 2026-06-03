# =============================================================================
# MBG Frontend (Next.js) - Dockerfile
# =============================================================================

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init libc6-compat

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY tsconfig.json next.config.ts postcss.config.mjs ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN npx next build --webpack

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
