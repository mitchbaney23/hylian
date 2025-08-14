# Use Node.js 18 alpine for smaller image size
FROM node:18-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install root dependencies
RUN npm ci

# Copy server files including Prisma schema
COPY server/ ./server/

# Install server dependencies and generate Prisma client
WORKDIR /app/server
RUN npm ci && npx prisma generate

# Copy client files and install dependencies
WORKDIR /app
COPY client/ ./client/
WORKDIR /app/client
RUN npm ci

# Build client
WORKDIR /app
RUN npm run client:build

# Build server
RUN npm run server:build

# Create uploads directory
RUN mkdir -p /app/server/uploads

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start the application with migration
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]