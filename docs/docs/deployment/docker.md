---
sidebar_position: 2
title: Docker Deployment
sidebar_label: Docker
description: Deploying Unchained Engine with Docker
---

# Docker Deployment

This guide covers deploying Unchained Engine using Docker containers.

## Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S unchained && \
    adduser -S unchained -u 1001

# Copy built files
COPY --from=builder --chown=unchained:unchained /app/node_modules ./node_modules
COPY --from=builder --chown=unchained:unchained /app/lib ./lib
COPY --from=builder --chown=unchained:unchained /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=4010

# Switch to non-root user
USER unchained

# Expose port
EXPOSE 4010

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4010/graphql || exit 1

# Start server
CMD ["node", "lib/index.js"]
```

## Docker Compose

For local development or simple deployments:

```yaml
# docker-compose.yml
version: '3.8'

services:
  engine:
    build: .
    ports:
      - "4010:4010"
    environment:
      - NODE_ENV=production
      - ROOT_URL=http://localhost:4010
      - MONGO_URL=mongodb://mongo:27017/unchained
      - UNCHAINED_TOKEN_SECRET=${UNCHAINED_TOKEN_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  admin-ui:
    image: unchainedshop/admin-ui:latest
    ports:
      - "4011:3000"
    environment:
      - UNCHAINED_ENDPOINT=http://engine:4010/graphql
    depends_on:
      - engine

volumes:
  mongo_data:
```

### With Redis and MinIO

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  engine:
    build: .
    ports:
      - "4010:4010"
    environment:
      - NODE_ENV=production
      - ROOT_URL=https://api.myshop.com
      - MONGO_URL=mongodb://mongo:27017/unchained
      - REDIS_URL=redis://redis:6379
      - UNCHAINED_TOKEN_SECRET=${UNCHAINED_TOKEN_SECRET}
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=unchained-files
    depends_on:
      - mongo
      - redis
      - minio
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    command: server /data --console-address ":9001"
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
  minio_data:
```

## Building and Running

### Build Image

```bash
# Build the image
docker build -t my-shop:latest .

# Build with build args
docker build \
  --build-arg NODE_ENV=production \
  -t my-shop:latest .
```

### Run Container

```bash
# Run with environment variables
docker run -d \
  --name my-shop \
  -p 4010:4010 \
  -e NODE_ENV=production \
  -e ROOT_URL=https://api.myshop.com \
  -e MONGO_URL=mongodb://... \
  -e UNCHAINED_TOKEN_SECRET=your-secret \
  my-shop:latest
```

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f engine

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Kubernetes

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unchained-engine
  labels:
    app: unchained-engine
spec:
  replicas: 2
  selector:
    matchLabels:
      app: unchained-engine
  template:
    metadata:
      labels:
        app: unchained-engine
    spec:
      containers:
        - name: engine
          image: my-shop:latest
          ports:
            - containerPort: 4010
          envFrom:
            - secretRef:
                name: unchained-secrets
            - configMapRef:
                name: unchained-config
          resources:
            requests:
              memory: "256Mi"
              cpu: "200m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /graphql
              port: 4010
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /graphql
              port: 4010
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: unchained-engine
spec:
  selector:
    app: unchained-engine
  ports:
    - protocol: TCP
      port: 80
      targetPort: 4010
  type: ClusterIP
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: unchained-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.myshop.com
      secretName: unchained-tls
  rules:
    - host: api.myshop.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: unchained-engine
                port:
                  number: 80
```

### ConfigMap and Secrets

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: unchained-config
data:
  NODE_ENV: "production"
  ROOT_URL: "https://api.myshop.com"
  EMAIL_FROM: "noreply@myshop.com"
  EMAIL_WEBSITE_NAME: "My Shop"
```

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: unchained-secrets
type: Opaque
stringData:
  MONGO_URL: "mongodb+srv://..."
  UNCHAINED_TOKEN_SECRET: "your-secret-here"
  STRIPE_SECRET_KEY: "sk_live_..."
```

## Multi-Stage Builds

Optimize your Docker image with multi-stage builds:

```dockerfile
# syntax=docker/dockerfile:1

# Dependencies stage
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S unchained -u 1001

COPY --from=builder --chown=unchained:nodejs /app/lib ./lib
COPY --from=deps --chown=unchained:nodejs /app/node_modules ./node_modules
COPY --chown=unchained:nodejs package.json ./

USER unchained

EXPOSE 4010

CMD ["node", "lib/index.js"]
```

## Environment Variables

Create a `.env` file for Docker Compose:

```bash
# .env
NODE_ENV=production
ROOT_URL=https://api.myshop.com
UNCHAINED_TOKEN_SECRET=your-32-character-secret-here
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

## Health Checks

### Simple Health Check

```typescript
// src/health.ts
import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4010/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

## Logging

Configure logging for containers:

```typescript
// Use JSON logging in production
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('app');

// Logs will be JSON formatted
logger.info('Server started', { port: 4010 });
```

```bash
# View container logs
docker logs -f my-shop

# With timestamps
docker logs -f --timestamps my-shop
```

## Best Practices

### 1. Use Non-Root User

```dockerfile
RUN adduser -S unchained
USER unchained
```

### 2. Pin Versions

```dockerfile
FROM node:22.0.0-alpine3.19
```

### 3. Use .dockerignore

```
# .dockerignore
node_modules
.git
.env
*.log
tests
docs
```

### 4. Cache Dependencies

```dockerfile
# Copy package files first
COPY package*.json ./
RUN npm ci

# Then copy source (changes don't invalidate npm cache)
COPY . .
```

### 5. Minimize Image Size

```dockerfile
FROM node:22-alpine  # Alpine is smaller
RUN npm ci --only=production  # No dev dependencies
```

## Related Documentation

- [Production Checklist](./production-checklist) - Pre-launch checklist
- [Environment Variables](../platform-configuration/environment-variables) - Configuration
