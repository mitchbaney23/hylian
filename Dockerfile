# Use Node.js 18 alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci
RUN cd server && npm ci
RUN cd client && npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN cd server && npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start the application with migration
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && npm start"]