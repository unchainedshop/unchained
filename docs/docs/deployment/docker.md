---
sidebar_position: 2
title: Docker Deployment
sidebar_label: Docker
description: Deploying Unchained Engine with Docker
---

# Docker Deployment

An Unchained project is a small Node.js app that consumes the `@unchainedshop/*` packages from npm (see [Server Setup](../guides/server-setup)). It runs TypeScript directly via Node's type stripping — there is no build step, so a single-stage image is all you need.

The Dockerfile below is the one used by the official starter, [unchainedshop/unchained-app](https://github.com/unchainedshop/unchained-app):

```dockerfile
FROM node:24-alpine

RUN mkdir -p /webapp
WORKDIR /webapp
COPY package* /webapp/

ENV PORT=3000
ENV NODE_ENV=production

RUN npm ci

COPY . /webapp/

HEALTHCHECK --start-period=10s --interval=20s --timeout=2s \
  CMD wget --spider --header 'content-type: application/json' http://127.0.0.1:${PORT}/.well-known/health

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

`npm start` in the starter runs the entry file directly:

```json
"start": "node --no-warnings --experimental-strip-types --env-file .env.defaults --env-file-if-exists=.env ./src/boot.ts"
```

:::note Monorepo Dockerfile
The `Dockerfile` at the root of the [unchainedshop/unchained](https://github.com/unchainedshop/unchained) monorepo is a CI/test image (based on `mongo`, running the whole workspace). It is not a deployment image — use the starter Dockerfile above for your own app.
:::

## Health endpoints

The `HEALTHCHECK` relies on routes your app defines itself. The starter adds a liveness and a readiness route to its Fastify instance:

```typescript
fastify.get('/.well-known/health', async () => {
  return { healthy: true };
});

fastify.get('/.well-known/ready', async (req, reply) => {
  const result = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/graphql`, {
    method: 'POST',
    body: JSON.stringify({ query: '{ shopInfo { _id country { _id } } }' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await result.json();
  if (!data?.errors?.length && data?.data?.shopInfo?._id) {
    return { ready: true };
  }
  return reply.code(503).send({ ready: false });
});
```

## .dockerignore

```
node_modules
.git
.env
*.log
```

## Docker Compose

`startPlatform` exits at boot if `ROOT_URL`, `UNCHAINED_TOKEN_SECRET`, `EMAIL_WEBSITE_NAME`, `EMAIL_WEBSITE_URL`, or `EMAIL_FROM` are missing — set all of them. The Admin UI is served by the engine itself (`connect(fastify, platform, { adminUI: true })`), so no separate container is needed.

```yaml
# docker-compose.yml
services:
  engine:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - ROOT_URL=http://localhost:3000
      - MONGO_URL=mongodb://mongo:27017/unchained
      - UNCHAINED_TOKEN_SECRET=${UNCHAINED_TOKEN_SECRET}
      - EMAIL_WEBSITE_NAME=My Shop
      - EMAIL_WEBSITE_URL=https://myshop.com
      - EMAIL_FROM=noreply@myshop.com
      - MAIL_URL=${MAIL_URL}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### With MinIO for file storage

The MinIO plugin reads `MINIO_ENDPOINT` (a full URL — there is no separate port variable), `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and `MINIO_BUCKET_NAME`:

```yaml
services:
  engine:
    # ... as above, plus:
    environment:
      - MINIO_ENDPOINT=http://minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET_NAME=unchained-files

  minio:
    image: minio/minio
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    command: server /data --console-address ":9001"
    restart: unless-stopped

volumes:
  minio_data:
```

Remember to register `MinioPlugin` in your boot file before any preset registers GridFS — see [File Uploads](../guides/file-uploads).

## Kubernetes

Point the probes at the health routes shown above and keep secrets out of the ConfigMap:

```yaml
# k8s/deployment.yaml (container spec excerpt)
containers:
  - name: engine
    image: my-shop:latest
    ports:
      - containerPort: 3000
    envFrom:
      - secretRef:
          name: unchained-secrets
      - configMapRef:
          name: unchained-config
    livenessProbe:
      httpGet:
        path: /.well-known/health
        port: 3000
    readinessProbe:
      httpGet:
        path: /.well-known/ready
        port: 3000
```

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: unchained-secrets
type: Opaque
stringData:
  MONGO_URL: 'mongodb+srv://...'
  UNCHAINED_TOKEN_SECRET: 'your-32-char-minimum-secret'
  STRIPE_SECRET: 'sk_live_...'
  STRIPE_ENDPOINT_SECRET: 'whsec_...'
```

## Related

- [Production Checklist](./production-checklist) - Pre-launch checklist
- [Environment Variables](../platform-configuration/environment-variables) - Canonical configuration reference
