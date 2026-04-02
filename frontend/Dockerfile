# ── Development stage (default) ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# Install wget and SWC binary for Alpine (musl libc) — separate layer after npm install
# so Docker cache for npm install is reused on rebuilds.
RUN apk add --no-cache wget && \
    NEXT_VERSION=$(node -e "console.log(require('./node_modules/next/package.json').version)") && \
    SWC_DIR="node_modules/@next/swc-linux-x64-musl" && \
    mkdir -p "$SWC_DIR" && \
    for i in 1 2 3; do \
      wget -q \
        "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-${NEXT_VERSION}.tgz" \
        -O /tmp/swc.tgz && break || (echo "Retry $i/3..." && sleep 5); \
    done && \
    tar xzf /tmp/swc.tgz -C /tmp && \
    cp /tmp/package/next-swc.linux-x64-musl.node "$SWC_DIR/" && \
    cp /tmp/package/package.json "$SWC_DIR/" && \
    rm -rf /tmp/swc.tgz /tmp/package && \
    echo "SWC binary installed OK for Next.js ${NEXT_VERSION}"

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]


# ── Production build stage ─────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

RUN apk add --no-cache wget && \
    NEXT_VERSION=$(node -e "console.log(require('./node_modules/next/package.json').version)") && \
    SWC_DIR="node_modules/@next/swc-linux-x64-musl" && \
    mkdir -p "$SWC_DIR" && \
    for i in 1 2 3; do \
      wget -q \
        "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-${NEXT_VERSION}.tgz" \
        -O /tmp/swc.tgz && break || (echo "Retry $i/3..." && sleep 5); \
    done && \
    tar xzf /tmp/swc.tgz -C /tmp && \
    cp /tmp/package/next-swc.linux-x64-musl.node "$SWC_DIR/" && \
    cp /tmp/package/package.json "$SWC_DIR/" && \
    rm -rf /tmp/swc.tgz /tmp/package

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_SHARE_URL
ENV NEXT_PUBLIC_SHARE_URL=${NEXT_PUBLIC_SHARE_URL}

RUN npm run build


# ── Production runtime stage ────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
