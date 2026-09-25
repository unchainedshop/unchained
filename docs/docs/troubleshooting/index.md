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

#### MongoDB Won't Start: `DBException in initAndListen`

Without `MONGO_URL`, the engine starts its own MongoDB for local development. Outside `NODE_ENV=test` it is **not** in-memory: the data is kept in `.db` in the working directory, and MongoDB listens on `PORT + 1`. That has three consequences:

- Data survives restarts. Delete `.db` to start from scratch.
- Two instances started from the same directory share `.db`, and the second MongoDB fails with `DBException in initAndListen`.
- An instance on `PORT` blocks `PORT + 1` for anything else, e.g. a second instance you want to start on the next port.

**Solution:** give each instance its own directory and a port gap of two, or point additional instances at the first MongoDB with a separate database name:

```bash
MONGO_URL=mongodb://127.0.0.1:4011/second-instance PORT=4020 npm start
```

#### Environment Variables Are Ignored

The examples load `.env.defaults` first, then `.env`. Variables already set in the shell take precedence over both files, which is handy for one-off overrides:

```bash
PORT=4020 ROOT_URL=http://localhost:4020 npm start
```

If a value in `.env` seems to have no effect, check whether your shell exports the same variable.

#### `The decorator 'serializeCookie' has already been added!`

Up to v5.0.0-alpha.7, `connect()` and `@fastify/oauth2` (or any plugin that brings its own `@fastify/cookie`) both registered the cookie plugin, and Fastify refused to start. Upgrade, or `await fastify.register(fastifyCookie)` yourself before registering `@fastify/oauth2` and calling `connect()`; both skip their own registration when the cookie plugin is already loaded.

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

### Single Sign-On (OIDC)

The [OIDC example](https://github.com/unchainedshop/unchained/tree/master/examples/oidc) describes a complete Keycloak and Zitadel setup.

#### SSO Users Have No Permissions in the Admin UI

The login works, but every Admin UI request fails with `NoPermissionError` because the user was created without roles.

- **Keycloak** adds client roles (`resource_access`) to the access token, not to the ID token. Read the roles from the verified access token (the OIDC example does), or enable *Add to ID token* on the client roles mapper.
- **Zitadel** only adds project roles (`urn:zitadel:iam:org:project:roles`) to the ID token when *Assert Roles on Authentication* is enabled on the project and *User roles inside ID Token* on the application.

Roles are copied on every login, so the user has to log in again after you fix the mapping.

#### Back-Channel Logout Returns 200, but the User Stays Logged In

- If you store users under a provider-specific id such as `${clientId}:${sub}`, configure `userIdFromSubject` on the OIDC provider. Without it the logout token's `sub` matches no user, and the endpoint still answers 200 as the specification requires.
- The identity provider must reach `ROOT_URL/backchannel-logout`. An identity provider running in Docker reaches your machine at `host.docker.internal`, not `localhost`.
- Zitadel refuses back-channel logout URLs on private or internal hosts (`Errors.Project.App.Blocked.BackchannelLogoutURL`). Use a publicly reachable URL.

#### Identity Provider Access Tokens Are Not Accepted as Bearer Tokens

- The token's `aud` must contain the provider's configured `audience`. Keycloak does not add the client id to access tokens by default: add an *Audience* protocol mapper to the client.
- The token only authenticates users that already exist; the OIDC example creates them on their first browser login.
- Up to v5.0.0-alpha.7 the engine expected the keys at `${issuer}/.well-known/jwks.json`, which neither Keycloak nor Zitadel serve. Set `jwksUri` explicitly there (Keycloak: `…/protocol/openid-connect/certs`, Zitadel: `…/oauth/v2/keys`). Newer versions use OIDC discovery.

#### `Token verification error: "alg" (Algorithm) Header Parameter value not allowed`

Harmless. Up to v5.0.0-alpha.7 every bearer token is first checked as an Unchained token (HS256). An identity provider's token (RS256) fails that check and was logged at error level before it was verified against the OIDC providers. If the request is authenticated, you can ignore the line. Newer versions log it at debug level.

#### MCP OAuth with Keycloak Dynamic Client Registration Fails

- `Policy 'Allowed Client Scopes' rejected request`: don't request `openid` in the registration metadata, it is not a Keycloak client scope. Without a `scope`, the realm's default client scopes apply.
- `Policy 'Trusted Hosts' rejected request … Host not trusted`: register with an initial access token (`INITIAL_ACCESS_TOKEN`) or configure the trusted hosts of the anonymous registration policy.
- `403 MCP requires admin privileges`: grant the registered client's service account the `admin` role of your Unchained client **and** add that role to the registered client's scope mappings. Dynamically registered clients have full scope disabled, so otherwise the role never reaches the token.

### MCP

#### `/mcp` Answers 400 or 406

The streamable HTTP transport requires both media types in the `Accept` header:

```bash
curl -X POST http://localhost:4010/mcp \
  -H 'authorization: Bearer <token>' \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Plugin Routes and Webhooks

#### Route Returns 404 on Fastify, but Works on Express

Fastify matches paths exactly: `/rest/print_tickets/` does not match a route registered as `/rest/print_tickets`. Call the exact path, or create the Fastify instance with `routerOptions: { ignoreTrailingSlash: true }`.

#### Webhooks and Uploads Time Out on Express

Up to v5.0.0-alpha.7, routes registered by plugins (payment webhooks, file uploads, bulk import, back-channel logout) ran on Express but never sent their response. Upgrade.

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

#### An Admin UI Plugin Is Missing

```
Failed to read bundle for plugin "bookmark-manager" at …/dist/index.js: ENOENT
```

Admin UI plugins are standalone packages that are built separately; installing the engine does not build them. Run `npm install` and `npm run build` in the plugin folder (in the kitchensink examples: `npm run build:plugin`).

Import hooks and components from `@unchainedshop/admin-ui/modules/*` and `@unchainedshop/admin-ui/plugins`. The Admin UI provides them at runtime, so the plugin shares its Apollo client and session. Don't bundle a second copy through `@unchainedshop/client`.

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

2. Outside production (`NODE_ENV !== 'production'`), emails are intercepted instead of sent unless `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` is set (see below)
3. Verify SMTP credentials and check the spam folder

#### Every Email Opens a Browser Tab

Outside production, the email worker intercepts messages: it writes an HTML preview to a temporary folder and opens it with your system's `open`/`xdg-open`. Every sign-up, verification or order confirmation therefore opens a browser tab while you develop.

Set `UNCHAINED_DISABLE_EMAIL_INTERCEPTION=1` to turn this off, for example when scripting against a local engine. Emails are then sent through `MAIL_URL`; without `MAIL_URL`, the email work items fail with `NO_MAIL_URL_SET`.

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
