---
sidebar_position: 3
title: Security
sidebar_label: Security
description: Security features, compliance support, and best practices for Unchained Engine
---

# Security

Unchained Engine implements security best practices for e-commerce applications, supporting compliance with PCI DSS, ISO 27001, SOC 2, and other standards.

:::info Full Security Documentation
For detailed security documentation including compliance matrices, FIPS 140-3 configuration, and deployment recommendations, see the [SECURITY.md](https://github.com/unchainedshop/unchained/blob/master/SECURITY.md) file in the repository.
:::

## Compliance Support

| Standard | Support Level | What This Means |
|----------|---------------|-----------------|
| **PCI DSS SAQ-A** | Compatible | No card data storage; uses tokenization |
| **ISO 27001** | Technical Controls | Access control, audit logging, cryptographic standards |
| **FIPS 140-3** | Algorithm Compatible | Uses FIPS-approved algorithms (PBKDF2, SHA-256/512, AES-256-GCM) |
| **SOC 2** | Audit Support | Tamper-evident audit logs for evidence collection |
| **GDPR** | Technical Measures | Audit logging supports Article 30 requirements |

## Cryptographic Standards

### Password Hashing

Unchained uses PBKDF2 with industry-leading parameters:

- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 300,000 (exceeds OWASP recommendation of 210,000)
- **Salt**: 16 bytes, cryptographically random
- **Key Length**: 256 bytes
- **Implementation**: Web Crypto API (`crypto.subtle`)

### Token Security

- **Generation**: `crypto.randomUUID()` (CSPRNG-based)
- **Storage**: SHA-256 hashed before database storage
- **Expiration**: Time-limited (1 hour for verification tokens)
- **Single Use**: Tokens invalidated after use

### Session Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Size**: 32 bytes
- **Implementation**: kruptein library

## Payment Security (PCI DSS)

Unchained is designed for **PCI DSS SAQ-A eligibility**:

- Credit card numbers (PAN) are **never stored**
- CVV/CVC codes are **never stored**
- Only payment provider tokens are stored

All payment integrations use tokenization:

| Provider | Tokenization Method |
|----------|-------------------|
| Stripe | PaymentIntent / SetupIntent |
| Datatrans | Secure Fields |
| Saferpay | Redirect with token |
| Braintree | Client SDK tokenization |
| PayPal | Order ID reference |

## Access Control

### Role-Based Access Control (RBAC)

- **128+ defined actions** covering all API operations
- **Built-in roles**: admin, logged-in user, guest
- **Ownership validation**: Users can only access their own resources
- **Field-level permissions**: GraphQL type resolvers enforce access

```typescript
// Example permission check
role.allow(actions.updateOrder, async (obj, params, context) => {
  const order = await modules.orders.findOrder({ orderId: params.orderId });
  return order.userId === context.userId;
});
```

## Audit Logging

Unchained provides **OCSF-compliant** (Open Cybersecurity Schema Framework) audit logging with tamper-evident hash chains.

### Features

- **OCSF v1.4.0 schema** - Industry-standard format supported by AWS Security Lake, Datadog, Splunk, Google Chronicle
- **Tamper-evident** - SHA-256 hash chain for integrity verification
- **Append-only** - No update or delete operations
- **SIEM-ready** - Direct ingestion into security monitoring tools

### Quick Start

```typescript
import { createAuditLog, configureAuditIntegration } from '@unchainedshop/events';

// Create audit log instance
const auditLog = createAuditLog('./audit-logs');

// Enable automatic event capture
configureAuditIntegration(auditLog);

// Events automatically captured:
// - Login/logout
// - User creation/deletion
// - Password changes
// - Role changes
// - Order checkout
// - Payments
```

See [Audit Logging](../extend/events#audit-logging) for detailed documentation.

## Input Validation

### ReDoS Prevention

All user-supplied strings used in regular expressions are escaped:

```typescript
import { escapeRegexString } from '@unchainedshop/utils';

// User input is escaped before regex construction
const regex = new RegExp(escapeRegexString(userInput), 'i');
```

### Timing Attack Prevention

Security-sensitive string comparisons use constant-time algorithms:

```typescript
import { timingSafeStringEqual } from '@unchainedshop/utils';

// Constant-time comparison for tokens/secrets
if (await timingSafeStringEqual(providedToken, expectedToken)) {
  // Token is valid
}
```

## Session Security

### Cookie Configuration

```typescript
// Secure defaults
{
  httpOnly: true,           // Prevent XSS access
  secure: true,             // HTTPS only
  sameSite: 'none',         // Configurable
  maxAge: 604800,           // 7 days
}
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | Session encryption (min 32 chars) | Required |
| `UNCHAINED_COOKIE_NAME` | Cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_DOMAIN` | Cookie domain restriction | - |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute | `none` |
| `UNCHAINED_COOKIE_INSECURE` | Disable secure flag | `false` |

## Error Handling

Errors are designed to prevent information leakage:

- **Authentication errors**: Generic "Invalid credentials" message
- **Token errors**: "Token invalid or expired" (doesn't distinguish)
- **Permission errors**: "Not authorized" (no action details)
- **User enumeration prevention**: Password reset returns success regardless of user existence

## Rate Limiting

Rate limiting should be implemented at the **reverse proxy level** (nginx, Cloudflare, AWS ALB):

```nginx
# nginx example
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

server {
    location /graphql {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://unchained:4000;
    }
}
```

### Recommended Limits

| Endpoint | Recommended Limit | Rationale |
|----------|------------------|-----------|
| Login mutations | 5/minute per IP | Prevent brute force |
| Password reset | 3/hour per IP | Prevent enumeration |
| Registration | 10/hour per IP | Prevent spam |
| GraphQL queries | 100/second per IP | General protection |

## FIPS 140-3 Mode

For environments requiring FIPS compliance, use a FIPS-validated runtime:

```dockerfile
# Using Chainguard FIPS image
FROM cgr.dev/chainguard/node-fips:latest

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["node", "index.js"]
```

See [SECURITY.md](https://github.com/unchainedshop/unchained/blob/master/SECURITY.md#fips-140-3-compatibility) for detailed FIPS configuration.

## Reporting Vulnerabilities

If you discover a security vulnerability:

- **Email**: hello@unchained.shop
- **Do NOT** open public GitHub issues for security vulnerabilities

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Related

- [Production Checklist](./production-checklist) - Pre-launch security checklist
- [Authentication](../concepts/authentication) - Authentication patterns
- [Audit Logging](../extend/events#audit-logging) - Detailed audit logging docs
- [SECURITY.md](https://github.com/unchainedshop/unchained/blob/master/SECURITY.md) - Full security documentation
