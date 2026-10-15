# Generated for Smithery / Glama MCP container inspection
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
COPY indexer ./indexer
COPY sources ./sources
COPY seed ./seed

RUN npm run build

FROM node:22-slim AS release

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seed ./seed
COPY --from=builder /app/sources ./sources

ENTRYPOINT ["node", "--no-warnings", "dist/index.js"]
