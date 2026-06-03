# =============================================================================
# MBG Backend - Dockerfile
# =============================================================================

FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY tsconfig.json nodemon.json ./
COPY src ./src

RUN mkdir -p uploads

ENV NODE_ENV=development \
    PORT=3001

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
