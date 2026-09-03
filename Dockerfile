FROM node:22-bookworm-slim

WORKDIR /usr/src/app

# Install production dependencies first so this layer is cached unless
# package*.json changes. bcrypt ships prebuilt N-API binaries for Node 22.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --chown=node:node . .

ENV NODE_ENV=production
ENV PORT=8000
USER node
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "app.js"]
