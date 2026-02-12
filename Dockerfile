# --- Build Stage ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .

# --- Runtime Stage ---
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 42069

CMD ["npm", "run", "start"]
