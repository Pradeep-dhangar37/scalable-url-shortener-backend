# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

# Stage 2: Final minimal production image
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy application source folders and server.js
COPY config/ ./config/
COPY controller/ ./controller/
COPY models/ ./models/
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY server.js ./

# Run the container as the non-root node user for security
USER node

EXPOSE 3000

CMD ["node", "server.js"]
