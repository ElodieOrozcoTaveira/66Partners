# Dockerfile pour déploiement Railway simplifié
FROM node:22-alpine AS builder

WORKDIR /app

# Frontend build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --legacy-peer-deps

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Backend build  
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Install TypeScript globally for build
RUN npm install -g typescript

COPY backend/ ./backend/
RUN cd backend && npm run build

# Clean install without dev dependencies for production
RUN cd backend && npm ci --omit=dev

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built frontend to the location expected by backend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy package.json and start script for the main application
COPY package.json start.js ./

EXPOSE 3000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]