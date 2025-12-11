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

**Solution:**

```bash
# Find process using port
lsof -i :4010

# Kill the process
kill -9 <PID>

# Or use a different port
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
Error: UNCHAINED_TOKEN_SECRET is required
```

**Solution:**

Create `.env` file with required variables:
```bash
UNCHAINED_TOKEN_SECRET=your-secret-at-least-32-characters
ROOT_URL=http://localhost:4010
```

### Authentication Issues

#### "Unauthorized" Error

```json
{"errors":[{"message":"Unauthorized"}]}
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
Error: No delivery provider set
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

1. Verify engine is running on correct port
2. Check CORS settings allow Admin UI origin
3. Clear browser cache/cookies

#### Login Not Working

**Solutions:**

1. Reset admin password via CLI or database
2. Check email verification isn't required
3. Verify user has admin role

### File Uploads

#### Upload Fails

**Solutions:**

1. Ensure a file storage plugin is imported in your entry file:
```typescript
// GridFS (MongoDB built-in)
import '@unchainedshop/plugins/files/gridfs';

// Or MinIO/S3
import '@unchainedshop/plugins/files/minio';
```

2. For MinIO/S3, verify credentials:
```bash
MINIO_ENDPOINT=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=...
```

3. Check file size limits

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

2. Check for memory leaks
3. Monitor with:
```bash
node --inspect lib/index.js
```

### Email Issues

#### Emails Not Sending

**Solutions:**

1. Check MAIL_URL is configured:
```bash
MAIL_URL=smtp://user:pass@smtp.example.com:587
```

2. Verify SMTP credentials
3. Check spam folder
4. Test with email preview (development only)

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

### Before Asking for Help

1. Check this troubleshooting guide
2. Search [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
3. Review [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)

### Providing Information

When reporting issues, include:

1. **Environment**:
   - Node.js version (`node --version`)
   - Unchained version (`npm list @unchainedshop/platform`)
   - Operating system

2. **Error message**: Full error with stack trace

3. **Steps to reproduce**: Minimal example

4. **Relevant configuration**: (sanitize secrets)

5. **Logs**: Recent log output

### Example Issue Report

````markdown
## Environment
- Node.js: 22.0.0
- Unchained: 3.0.0
- OS: macOS 14.0

## Description
Checkout fails with "Payment provider not found" error

## Steps to Reproduce
1. Create cart
2. Add product
3. Set delivery provider
4. Call checkoutCart

## Error
```
Error: Payment provider not found for order xyz
    at PaymentDirector.resolve (...)
```

## Configuration
```typescript
await startPlatform({
  // ... config
});
```

## Expected Behavior
Checkout should complete using default payment provider
````

## Related Documentation

- [FAQ](./faq) - Frequently asked questions
