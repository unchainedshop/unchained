---
sidebar_position: 3
title: Security
sidebar_label: Security
description: Security features and best practices for Unchained Engine
---

# Security

Unchained Engine implements security best practices for e-commerce applications.

:::info Full Security Documentation
For detailed security documentation including compliance information and deployment recommendations, see the [SECURITY.md](https://github.com/unchainedshop/unchained/blob/master/SECURITY.md) file in the repository.
:::

## Cryptographic Standards

### Password Hashing

- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 300,000 (exceeds OWASP recommendation of 210,000)
- **Salt**: 16 bytes, cryptographically random
- **Key Length**: 256 bits (32 bytes)
- **Implementation**: Web Crypto API (`crypto.subtle`)

### Access Tokens (Sessions)

- **Format**: JWT, signed with HS256 (`jose`)
- **Secret**: `UNCHAINED_TOKEN_SECRET`, minimum 32 characters (enforced at boot)
- **Expiry**: `UNCHAINED_TOKEN_EXPIRY_SECONDS`, default 3600 (1 hour)

### Verification & Reset Tokens

- **Generation**: `crypto.randomUUID()` (CSPRNG-based)
- **Storage**: SHA-256 hashed before database storage

## Payment Security

Unchained never stores card data:

- Credit card numbers (PAN) are **never stored**
- CVV/CVC codes are **never stored**
- Payment adapters only store provider-side transaction references and tokens

Bundled payment integrations: Stripe, Datatrans, PostFinance Checkout, Saferpay, Payrexx, Apple IAP, Cryptopay, and invoice-based flows. See [Payment Integration](../guides/payment-integration).

## Access Control

### Role-Based Access Control (RBAC)

- **Over 100 defined actions** covering all API operations
- **Built-in roles**: admin, logged-in user, plus special roles for guests
- **Ownership validation**: Users can only access their own resources

```typescript
// Example permission check
role.allow(actions.updateOrder, async (order, params, context) => {
  return order.userId === context.userId;
});
```

See [Permissions](../concepts/permissions) for defining custom roles via `rolesOptions`.

## Audit Logging

Unchained provides **OCSF-compliant** (Open Cybersecurity Schema Framework) audit logging with tamper-evident hash chains:

- **OCSF v1.4.0 schema** - Industry-standard format supported by AWS Security Lake, Datadog, Splunk, Google Chronicle
- **Tamper-evident** - SHA-256 hash chain for integrity verification
- **Append-only** - No update or delete operations

```typescript
import { createAuditLog, configureAuditIntegration } from '@unchainedshop/events';

const auditLog = createAuditLog('./audit-logs');
configureAuditIntegration(auditLog);

// Automatically captured: login/logout, user creation/deletion,
// password changes, role changes, order checkout, payments
```

See [Audit Logging](../extend/events#audit-logging-ocsf) for detailed documentation.

## Input Validation

### ReDoS Prevention

All user-supplied strings used in regular expressions are escaped:

```typescript
import { escapeRegexString } from '@unchainedshop/mongodb';

const regex = new RegExp(escapeRegexString(userInput), 'i');
```

### Timing Attack Prevention

Security-sensitive string comparisons use constant-time algorithms:

```typescript
import { timingSafeStringEqual } from '@unchainedshop/utils';

if (await timingSafeStringEqual(providedToken, expectedToken)) {
  // Token is valid
}
```

## Session Cookies

The JWT is delivered as an `httpOnly` cookie with these defaults:

```typescript
{
  httpOnly: true,           // always true, prevents XSS access
  secure: true,             // unless UNCHAINED_COOKIE_INSECURE is set
  sameSite: 'lax',          // OWASP: CSRF protection
  maxAge: 3600 * 1000,      // follows UNCHAINED_TOKEN_EXPIRY_SECONDS
}
```

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | JWT signing secret (min 32 chars) | Required |
| `UNCHAINED_TOKEN_EXPIRY_SECONDS` | Token and cookie lifetime | `3600` |
| `UNCHAINED_COOKIE_NAME` | Cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_DOMAIN` | Cookie domain restriction | - |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute (`strict`, `lax`, `none`) | `lax` |
| `UNCHAINED_COOKIE_INSECURE` | Disable secure flag (development only) | - |

## Error Handling

Errors are designed to prevent information leakage:

- **Permission errors**: Generic "not authorized" responses
- **User enumeration prevention**: `forgotPassword` returns success regardless of whether the user exists

## Rate Limiting

Rate limiting should be implemented at the **reverse proxy level** (nginx, Cloudflare, AWS ALB):

```nginx
# nginx example
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

server {
    location /graphql {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://unchained:3000;
    }
}
```

| Endpoint | Recommended Limit | Rationale |
|----------|------------------|-----------|
| Login mutations | 5/minute per IP | Prevent brute force |
| Password reset | 3/hour per IP | Prevent enumeration |
| Registration | 10/hour per IP | Prevent spam |
| GraphQL queries | 100/second per IP | General protection |

## Reporting Vulnerabilities

If you discover a security vulnerability:

- **Email**: hello@unchained.shop
- **Do NOT** open public GitHub issues for security vulnerabilities

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Related

- [Production Checklist](./production-checklist) - Pre-launch security checklist
- [Authentication](../concepts/authentication) - Authentication patterns
- [Audit Logging](../extend/events#audit-logging-ocsf) - Detailed audit logging docs
- [SECURITY.md](https://github.com/unchainedshop/unchained/blob/master/SECURITY.md) - Full security documentation
