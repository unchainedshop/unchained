---
sidebar_position: 4
title: Production Checklist
sidebar_label: Production Checklist
description: Pre-launch checklist for Unchained Engine
---

# Production Checklist

Use this checklist to ensure your Unchained Engine deployment is production-ready. For the full list of configuration options, see [Environment Variables](../platform-configuration/environment-variables) — this page only covers what typically goes wrong at launch.

## Environment

- [ ] **`NODE_ENV=production`** - Enables production behavior across the engine (and turns off email interception, see below)
- [ ] **Required boot variables set** - `startPlatform` exits if `ROOT_URL`, `UNCHAINED_TOKEN_SECRET`, `EMAIL_WEBSITE_NAME`, `EMAIL_WEBSITE_URL`, or `EMAIL_FROM` are missing
- [ ] **`UNCHAINED_TOKEN_SECRET`** - Strong, unique, minimum 32 characters (boot fails otherwise)
- [ ] **`MONGO_URL` set** - Without it, the engine spawns a local `mongod` (via `mongodb-memory-server`) that stores its data in `./.db`. Data does survive restarts, but this is not production-appropriate: an unmanaged, single-node local mongod with no backups, replication, or authentication
- [ ] **No secrets in code or images** - All secrets from environment
- [ ] **Seed/admin credentials rotated** - Don't ship `UNCHAINED_SEED_PASSWORD`-style development passwords

```bash
# Generate a secure secret
openssl rand -base64 32  # For UNCHAINED_TOKEN_SECRET
```

## Cookies & Sessions

- [ ] **HTTPS enforced** - Cookies default to `secure`; never set `UNCHAINED_COOKIE_INSECURE` in production
- [ ] **`UNCHAINED_COOKIE_SAMESITE` reviewed** - Default is `lax`; only set `none` if your storefront runs on a different site, and only over HTTPS
- [ ] **`UNCHAINED_COOKIE_DOMAIN` set** - If storefront and engine share a parent domain

See [Security](./security#session-cookies) for the full cookie reference.

## CORS

The engine does not restrict origins itself: the GraphQL endpoint (GraphQL Yoga) reflects the request `Origin` header by default, and `allowRemoteToLocalhostSecureCookies` is a development-only mode that throws in production. To restrict cross-origin access:

- [ ] **Enforce allowed origins at your reverse proxy/CDN** - This covers all routes (GraphQL, webhooks, `/chat`)
- [ ] Optionally pass Yoga's `cors` option through `startPlatform` for the GraphQL endpoint:

```typescript
await startPlatform({
  cors: {
    origin: ['https://myshop.com'],
    credentials: true,
  },
});
```

The `/mcp` endpoint has its own built-in Origin/Host validation based on `ROOT_URL`.

## Audit Logging

- [ ] **Audit logging enabled** - OCSF-compliant audit logging configured
- [ ] **Log storage configured** - Audit logs persisted to file or pushed to a collector/SIEM

```typescript
import { createAuditLog, configureAuditIntegration } from '@unchainedshop/events';

const auditLog = createAuditLog({
  directory: './audit-logs',
  collectorUrl: process.env.AUDIT_COLLECTOR_URL, // optional HTTP push
});

configureAuditIntegration(auditLog);
```

## Database

- [ ] **MongoDB authentication** - Database requires authentication, not publicly accessible
- [ ] **Encrypted connections** - MongoDB connection uses TLS
- [ ] **Regular backups** - Automated backup schedule configured

Unchained creates its indexes automatically at startup; custom indexes are only needed for custom fields you query on.

## File Storage

- [ ] **Storage plugin registered** - GridFS (default in presets) or MinIO/S3
- [ ] **GridFS**: `UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET` set (required for PUT uploads and signed downloads)
- [ ] **MinIO/S3**: `MINIO_ENDPOINT` (full URL), `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_NAME` set

See [File Uploads](../guides/file-uploads).

## Email

- [ ] **`MAIL_URL` configured** - SMTP connection string; no emails are sent without it
- [ ] **Interception off** - Outside production, emails are intercepted (logged, not sent) unless `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` is set. With `NODE_ENV=production`, emails are always sent — make sure that's what you deploy with
- [ ] **Order confirmation and password reset tested** - Against the real SMTP server

## Payment Providers

- [ ] **Production API keys** - Not using test/sandbox keys
- [ ] **Webhooks pointed at production** - e.g. Stripe's webhook to `https://api.myshop.com/payment/stripe/webhook`
- [ ] **Webhook secrets set** - Signatures are validated

```bash
# Stripe plugin
STRIPE_SECRET=sk_live_...
STRIPE_ENDPOINT_SECRET=whsec_...
```

## Initial Data

- [ ] **Countries, currencies, languages** - Active entities configured (Admin UI or seed)
- [ ] **Products published** - Correct status and prices in all active currencies
- [ ] **At least one active payment and delivery provider** - Checkout fails without both

## Operations

- [ ] **Rate limiting at reverse proxy** - See [Security](./security#rate-limiting)
- [ ] **Health probes** - Liveness/readiness routes wired up, see [Docker Deployment](./docker#health-endpoints)
- [ ] **Structured logs collected** - `UNCHAINED_LOG_FORMAT=json` for log pipelines, `LOG_LEVEL=Info`
- [ ] **Full checkout tested on staging** - Cart → delivery → payment → confirmation email

## Quick Verification Commands

```bash
# Check Node.js version (needs 22+)
node --version

# Test MongoDB connection
mongosh "$MONGO_URL" --eval "db.adminCommand('ping')"

# Test API endpoint
curl https://api.myshop.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ shopInfo { _id } }"}'
```

## Related Documentation

- [Security Guide](./security) - Security features and practices
- [Environment Variables](../platform-configuration/environment-variables) - Full configuration reference
- [Docker Deployment](./docker) - Container deployment
- [Audit Logging](../extend/events#audit-logging-ocsf) - OCSF audit logging
