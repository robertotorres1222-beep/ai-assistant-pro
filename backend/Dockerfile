# AI Assistant Pro Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for code execution and file processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    bash \
    sqlite \
    curl \
    git \
    && ln -sf python3 /usr/bin/python

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S aiassistant -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs sandbox uploads && \
    chown -R aiassistant:nodejs /app

# Switch to non-root user
USER aiassistant

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]

