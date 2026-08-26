---
sidebar_position: 1
title: Troubleshooting
sidebar_label: Troubleshooting
description: Common issues and solutions for Unchained Engine
---

# Troubleshooting

This guide covers common issues and their solutions when working with Unchained Engine.

## Quick Diagnostics

### Check Server Health

```bash
# Test API endpoint
curl http://localhost:4010/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Expected response
{"data":{"__typename":"Query"}}
```

### Check Logs

```bash
# Development
npm run dev  # Watch console output

# Production (Docker)
docker logs -f my-shop

# Production (PM2)
pm2 logs
```

### Check MongoDB Connection

```bash
# Test connection
mongosh "mongodb://localhost:27017/unchained" --eval "db.adminCommand('ping')"

# Check collections
mongosh "mongodb://localhost:27017/unchained" --eval "db.getCollectionNames()"
```

## Common Issues

### Server Won't Start

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4010
```

**Solution:** stop the other process, or start on a different port:

```bash
PORT=4011 npm run dev
```

#### MongoDB Connection Failed

```
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. Start MongoDB:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 mongo:7
```

2. Check connection string in `.env`:
```bash
MONGO_URL=mongodb://localhost:27017/unchained
```

3. For MongoDB Atlas, ensure IP whitelist includes your IP

#### Missing Environment Variables

```
Missing required environment variables at boot time: EMAIL_WEBSITE_NAME, ...
```

**Solution:**

`startPlatform` exits unless all required variables are set. Create a `.env` file with:

```bash
ROOT_URL=http://localhost:4010
UNCHAINED_TOKEN_SECRET=your-secret-at-least-32-characters
EMAIL_WEBSITE_NAME=My Shop
EMAIL_WEBSITE_URL=http://localhost:4010
EMAIL_FROM=noreply@localhost
```

`UNCHAINED_TOKEN_SECRET` must be at least 32 characters — boot fails otherwise.

### Authentication Issues

#### "Not authorized" Error

```json
{"errors":[{"message":"Not authorized"}]}
```

**Solutions:**

1. Ensure Authorization header is set:
```http
Authorization: Bearer <your-token>
```

2. Check token hasn't expired
3. Verify token secret matches between requests

#### Guest Login Fails

**Solutions:**

1. Check user module is properly initialized
2. Verify database is writable
3. Check for validation errors in logs

### Cart and Checkout

#### "No Cart" / Cart is Empty

**Solutions:**

1. Ensure user is authenticated:
```graphql
mutation LoginAsGuest {
  loginAsGuest {
    _id
    tokenExpires
  }
}
```

2. Use the token in subsequent requests
3. Check cart was created:
```graphql
query {
  me {
    cart {
      _id
    }
  }
}
```

#### Checkout Fails

```
No delivery provider selected
```

**Solutions:**

1. Create delivery provider in Admin UI
2. Set delivery provider before checkout:
```graphql
mutation SetDeliveryProvider {
  updateCart(deliveryProviderId: "...") {
    _id
  }
}
```

3. Verify provider is active

#### Payment Not Processing

**Solutions:**

1. Check payment provider configuration
2. Verify API keys are correct (not test keys in production)
3. Check webhook is configured
4. Look for errors in payment provider dashboard

### Products

#### Product Not Visible

**Solutions:**

1. Check product status is "Active":
```graphql
query {
  product(productId: "...") {
    status
  }
}
```

2. Ensure product has at least one price:
```graphql
query ProductWithPrice {
  product(productId: "...") {
    ... on SimpleProduct {
      simulatedPrice(currencyCode: "CHF") {
        amount
        currencyCode
      }
    }
  }
}
```

3. Verify product is assigned to an assortment (if filtering by category)

#### Price Not Showing

**Solutions:**

1. Check price exists for the currency:
```graphql
mutation UpdateProductPricing {
  updateProductCommerce(productId: "...", commerce: {
    pricing: [{
      currencyCode: "CHF"
      countryCode: "CH"
      amount: 4900
      isTaxable: true
      isNetPrice: true
    }]
  }) {
    _id
  }
}
```

2. Verify currency is active
3. Check pricing adapters aren't filtering it out

### Admin UI

#### Can't Access Admin UI

**Solutions:**

1. Verify the engine is running and `adminUI: true` (or an options object) is passed to `connect()`
2. Verify the port and the `prefix` if you configured one
3. Clear browser cache/cookies

#### Login Not Working

**Solutions:**

1. Reset admin password via CLI or database
2. Check email verification isn't required
3. Verify user has admin role

### File Uploads

#### Upload Fails

**Solutions:**

1. Ensure a file storage plugin is registered before `startPlatform`. The presets register GridFS; for MinIO/S3 register `MinioPlugin` first (the first registered file adapter wins):

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { MinioPlugin } from '@unchainedshop/plugins/files/minio';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';

pluginRegistry.register(MinioPlugin); // must come before the preset
registerBasePlugins();
```

2. For MinIO/S3, verify credentials (`MINIO_ENDPOINT` must be a full URL):

```bash
MINIO_ENDPOINT=https://minio.example.com
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET_NAME=...
```

3. For GridFS PUT uploads and signed downloads, set `UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET`

See [File Uploads](../guides/file-uploads) for details.

#### Images Not Loading

**Solutions:**

1. Verify file URLs are accessible
2. Check CORS headers on storage
3. For signed URLs, ensure signature is valid

### Performance Issues

#### Slow Queries

Unchained Engine automatically creates indexes on commonly queried fields during startup. Adding custom indexes is only necessary when you've added custom fields to your schemas.

**Solutions:**

1. Add indexes for custom fields:
```typescript
// Only needed if you query by custom fields
await db.collection('products').createIndex({ 'meta.customField': 1 });
```

2. Check for N+1 queries in resolvers
3. Enable query logging to identify slow queries

#### Memory Issues

**Solutions:**

1. Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

2. Note: the fallback MongoDB used without `MONGO_URL` runs as a separate `mongod` child process with on-disk storage in `./.db` — it does not add to the Node.js process memory

### Email Issues

#### Emails Not Sending

**Solutions:**

1. Check MAIL_URL is configured:
```bash
MAIL_URL=smtp://user:pass@smtp.example.com:587
```

2. Outside production (`NODE_ENV !== 'production'`), emails are intercepted and logged instead of sent unless `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` is set
3. Verify SMTP credentials and check the spam folder

#### Email Template Errors

**Solutions:**

1. Check template syntax
2. Verify all required variables are passed
3. Look for errors in worker logs

## Debug Mode

Enable verbose logging:

```bash
# Enable debug logging
DEBUG=unchained:* npm run dev

# Specific modules
DEBUG=unchained:core:* npm run dev
DEBUG=unchained:api:* npm run dev
```

## Getting Help

1. Check this troubleshooting guide and the [FAQ](./faq)
2. Search [GitHub Issues](https://github.com/unchainedshop/unchained/issues) and [Discussions](https://github.com/unchainedshop/unchained/discussions)
3. When reporting an issue, include the Node.js version, the Unchained version (`npm list @unchainedshop/platform`), the full error with stack trace, and minimal steps to reproduce (sanitize secrets)
