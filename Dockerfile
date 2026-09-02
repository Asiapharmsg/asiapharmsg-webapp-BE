FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Install dependencies first so this layer is cached unless package*.json changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 8000

CMD ["node", "app.js"]
