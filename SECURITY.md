# Security

This document describes the security features, compliance posture, and best practices for deploying Unchained Engine in security-sensitive environments including banking, government, and enterprise contexts.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

- **Email**: hello@unchained.shop
- **Do NOT** open public GitHub issues for security vulnerabilities

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Compliance Support

This section describes how Unchained Engine can support compliance efforts. **Note**: Compliance certifications (PCI DSS, ISO 27001, SOC 2, etc.) are issued to organizations and their processes, not to software products. The controls described here can help organizations meet technical requirements.

| Standard | Support Level | What This Means |
|----------|---------------|-----------------|
| **PCI DSS SAQ-A** | Compatible | No card data storage; uses tokenization. Eligibility depends on your full deployment. |
| **ISO 27001** | Technical Controls | Implements access control, audit logging, and cryptographic standards. ISMS policies and processes are your responsibility. |
| **FIPS 140-3** | Deployment-dependent | Review the runtime, legacy bcrypt verification, and enabled plugins; see the limitations below. |
| **SOC 2** | Audit Support | Provides tamper-evident audit logs for evidence collection. SOC 2 audits evaluate your organization's controls, not software. |
| **FINMA 2023/1** | Technical Controls | Audit logging, access control, and cryptography support ICT risk management requirements. The circular is principle-based; organizational controls are your responsibility. |
| **Data protection** | Technical Measures | Access controls and audit logging are available; retention and data protection policies are deployment responsibilities. |

## Cryptographic Standards

Unchained Engine uses modern, standards-compliant cryptography throughout:

### Password Hashing

- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 300,000 (exceeds OWASP recommendation of 210,000)
- **Salt**: 16 bytes, cryptographically random
- **Key Length**: 256 bits (32 bytes)
- **Implementation**: Web Crypto API (`crypto.subtle`)
- **Legacy verification**: Existing bcrypt hashes are still supported; newly set passwords use PBKDF2

```typescript
// packages/core-users/src/module/pbkdf2.ts
const PBKDF2_ITERATIONS = 300000;
const PBKDF2_KEY_LENGTH = 256; // Bits, as required by crypto.subtle.deriveBits()
const PBKDF2_SALT_LENGTH = 16;
// Uses SHA-512 via crypto.subtle.deriveBits()
```

### Token Security

- **Token Generation**: `crypto.randomUUID()` (UUIDv4, with 122 random bits)
- **Token Storage**: SHA-256 hashed before database storage
- **Email verification/password reset**: Valid for 1 hour by default and invalidated after use; configurable through `earliestValidTokenDate`
- **API access tokens**: Reusable, with no built-in expiration; creating a new token replaces the previous one for that user

**Why SHA-256 for Tokens (not PBKDF2)?**

Password hashes use PBKDF2 to slow guessing of user-chosen passwords. API access
tokens are generated with a cryptographic random generator and stored as SHA-256
hashes for lookup on each authenticated request. Node's
[`crypto.randomUUID()`](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions)
generates UUIDv4 tokens.

```typescript
// packages/core-users/src/module/configureUsersModule.ts
// Preferred: Server generates high-entropy token
const result = await modules.users.createAccessToken('admin');
if (!result) throw new Error('Admin user not found');
const token = result.token; // Deliver once to the intended caller; avoid logging it
```

### Random Number Generation

- **Hash IDs**: Generated using `crypto.getRandomValues()` (CSPRNG)
- **Nonces**: `crypto.randomUUID()` for WebAuthn/Web3 challenges
- **No weak RNG**: `Math.random()` is never used for security-sensitive operations

### Session Storage

The Express and Fastify adapters store session data in MongoDB. The built-in
store does not initialize a session encryption provider. `UNCHAINED_TOKEN_SECRET`
signs session cookies; it does not encrypt session records. Configure encryption
at the database/storage layer or supply an application-specific session store
when encryption at rest is required.

### Payment Signature Verification

- **HMAC-SHA-256**: Datatrans, Payrexx, Saferpay, GridFS uploads
- **HMAC-SHA-512**: PostFinance Checkout

### WebAuthn/FIDO2

Full support for passwordless authentication via the WebAuthn standard, enabling hardware security keys and platform authenticators.

## FIPS 140-3 Compatibility

Unchained Engine is not FIPS-validated. Its new password hashes and token hashes
use Node.js cryptographic APIs, but legacy bcrypt verification and cryptocurrency
plugins also use JavaScript cryptography outside the OpenSSL provider. Assess the
enabled authentication and plugin paths for your deployment.

### FIPS-Approved Algorithms Used

The core Node.js cryptographic operations include:

| Operation | Algorithm | FIPS Status |
|-----------|-----------|-------------|
| Password Hashing | PBKDF2-SHA-512 | Approved |
| Token Hashing | SHA-256 | Approved |
| Payment Signatures | HMAC-SHA-256/512 | Approved |
| Random Generation | CSPRNG | Approved |

### Running in FIPS Mode

#### Option 1: A FIPS Runtime Image

Follow the runtime provider's build and deployment instructions, such as the
[Chainguard node-fips guide](https://images.chainguard.dev/directory/image/node-fips/overview).
Use the image and registry path available to your organization and verify its
entrypoint before setting the application command.

#### Option 2: Node.js with OpenSSL FIPS Provider

Use a Node.js binary with a correctly installed OpenSSL FIPS provider. Follow the
[Node.js FIPS configuration guide](https://nodejs.org/api/crypto.html#fips-mode),
including the provider installation file and module path:

```bash
# Point Node at the installed provider configuration, then enable FIPS mode
export OPENSSL_CONF=/path/to/openssl-fips.cnf
export OPENSSL_MODULES=/path/to/openssl-modules
node --enable-fips your-app.js
```

Example `openssl-fips.cnf`:
```ini
nodejs_conf = openssl_init
.include /path/to/fipsmodule.cnf

[openssl_init]
providers = provider_sect
alg_section = algorithm_sect

[provider_sect]
fips = fips_sect
base = base_sect

[base_sect]
activate = 1

[algorithm_sect]
default_properties = fips=yes
```

### Verifying FIPS Mode

```javascript
import crypto from 'crypto';

// Check if FIPS mode is enabled
console.log('FIPS mode:', crypto.getFips() === 1 ? 'enabled' : 'disabled');
```

### FIPS Considerations

1. **Legacy passwords**: Newly set passwords use PBKDF2-SHA512, but `verifyPassword` still accepts legacy bcrypt hashes. Enabling Node.js FIPS mode does not change that JavaScript verification path.

2. **Third-Party Libraries**: Verify that any additional npm packages you add use Node.js crypto APIs or are otherwise FIPS-compliant.

3. **Cryptopay Plugin**: Uses `@noble/curves` and `@noble/hashes` for cryptocurrency operations outside Node.js's OpenSSL provider. FIPS mode does not validate these implementations.

## Access Control

### Role-Based Access Control (RBAC)

Unchained implements comprehensive RBAC with:

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

### ACL Enforcement

All GraphQL mutations are protected with permission checks:

```typescript
// packages/api/src/resolvers/mutations/index.ts
export default {
  logout: acl(actions.logout)(logout),
  createUser: acl(actions.createUser)(createUser),
  setRoles: acl(actions.manageUsers)(setRoles),
  // ... all mutations protected
};
```

## Payment Security (PCI DSS)

Unchained is designed for **PCI DSS SAQ-A eligibility**:

### No Card Data Storage

- Credit card numbers (PAN) are **never stored**
- CVV/CVC codes are **never stored**
- Only payment provider tokens are stored

### Tokenization

All payment integrations use tokenization:

| Provider | Tokenization Method |
|----------|-------------------|
| Stripe | PaymentIntent / SetupIntent |
| Datatrans | Secure Fields |
| Saferpay | Redirect with token |
| Braintree | Client SDK tokenization |
| PayPal | Order ID reference |

### Payment Credentials

```typescript
// packages/core-payment/src/db/PaymentCredentialsCollection.ts
type PaymentCredentials = {
  paymentProviderId: string;
  userId: string;
  token?: string;      // Provider-issued token only
  isPreferred?: boolean;
  meta: any;           // Provider metadata
};
```

## Session Security

### Cookie Configuration

```typescript
// Secure defaults
const cookieOptions = {
  httpOnly: true,           // Prevent XSS access
  secure: true,             // HTTPS only (unless explicitly disabled)
  sameSite: 'none',         // Configurable
  maxAge: 604800000,        // 7 days in milliseconds
};
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | Session cookie signing secret (min 32 chars) | Required |
| `UNCHAINED_COOKIE_NAME` | Cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_DOMAIN` | Cookie domain restriction | - |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute | `none` |
| `UNCHAINED_COOKIE_INSECURE` | Any non-empty value disables the secure flag | Unset (secure cookies) |

## Error Handling

Errors are designed to prevent information leakage:

- **Authentication errors**: Generic "Invalid credentials" message
- **Token errors**: "Token invalid or expired" (doesn't distinguish)
- **Permission errors**: "Not authorized" (no action details)
- **Password validation**: "Too insecure" (no requirements revealed)
- **User enumeration prevention**: Password reset returns success regardless of user existence
- **Error details**: GraphQL errors may include resolver-supplied data in `extensions`; custom resolvers and logging need to avoid exposing sensitive values

## Input Validation

### ReDoS Prevention

Query builders use `escapeRegexString` when treating user input as literal text
inside a regular expression:

```typescript
import { escapeRegexString } from '@unchainedshop/mongodb';

// User input is escaped before regex construction
const regex = new RegExp(escapeRegexString(userInput), 'i');
```

The `escapeRegexString` function escapes regex metacharacters and throws
`TypeError` for non-strings. It accepts empty strings and does not limit length.
The separate `insensitiveTrimmedRegexOperator` helper trims the input, escapes it,
rejects empty results and escaped strings longer than 255 characters, and anchors
the resulting case-insensitive expression for exact matching.

### Query String Validation

Use the shared query helpers for literal matching and validate inputs in custom
query builders. Escaping regex metacharacters does not impose a query timeout or
limit how many documents a search scans.

### GraphQL Query Protection (Denial-of-Service)

Unchained does **not** enforce GraphQL query-complexity, depth, alias-count, or rate limits by default. As a headless engine embedded in the integrator's own server process, these edge protections are a **deployment responsibility** — correct thresholds depend on your schema extensions, expected traffic, and infrastructure.

This matters because:

- **Anonymous access is enabled by default** for read-only storefront queries (`assortments`, `products`, `filters`, `languages`, `currencies`, `countries`, `search`), gated in `packages/api/src/roles/all.ts`.
- **GraphQL alias batching** lets a single unauthenticated request repeat the same field under many aliases. Each aliased list field resolves to an independent database query, so an unbounded query can amplify one HTTP request into thousands of database operations (advisory `GHSA-732q-p8qr-4mcg`).

**Mitigations the integrator should apply:**

1. **In-process query validation.** GraphQL Yoga `plugins` and `validationRules` are forwarded verbatim through `startPlatform` / `startAPIServer` into the underlying Yoga instance (`packages/api/src/createGraphQLServer.ts`). Wire in alias, depth, and token/cost limits — e.g. [GraphQL Armor](https://escape.tech/graphql-armor/):

   ```ts
   import { startPlatform } from '@unchainedshop/platform';
   import { maxAliasesPlugin } from '@escape.tech/graphql-armor-max-aliases';
   import { maxDepthPlugin } from '@escape.tech/graphql-armor-max-depth';
   import { maxTokensPlugin } from '@escape.tech/graphql-armor-max-tokens';

   await startPlatform({
     // ...your options
     plugins: [
       maxAliasesPlugin({ n: 15 }),
       maxDepthPlugin({ n: 10 }),
       maxTokensPlugin({ n: 1000 }),
     ],
   });
   ```

   Build the `plugins` array explicitly; if you merge caller-supplied plugins, append the security plugins **last** so they cannot be silently overridden.

2. **Rate limiting & body-size limits at the edge.** Apply per-IP / per-token rate limits and request-body-size caps at the reverse proxy, API gateway, or WAF in front of the engine. Give anonymous traffic a tighter budget than authenticated traffic.

3. **Pagination clamping.** Clamp `limit` / offset in any custom list resolvers you add, and consider restricting anonymous access to list queries if your storefront does not require it.

## Audit Logging

Unchained provides append-only, tamper-evident audit logging based on the **OCSF (Open Cybersecurity Schema Framework)**. OCSF is an industry-standard schema developed by 120+ organizations (AWS, Splunk, IBM) and is now a Linux Foundation project. It is natively supported by AWS Security Lake, Google Chronicle, Datadog, Elastic, and other SIEM systems.

### Features

- **OCSF-based schema** - Uses OCSF v1.4.0 structure with e-commerce extensions
- **JSON Lines format** - Easy parsing and integration
- **Append-only** - No update or delete operations
- **Tamper-evident** - SHA-256 hash chain for integrity verification
- **File-based** - No external dependencies (MongoDB-free)
- **HTTP push** - Optional JSON batches to a collector accepting `{ events: [...] }`
- **SIEM-ready** - Direct ingestion into security monitoring tools
- **Event integration** - Automatic capture of authentication, orders, and payments
- **E-commerce specific** - Checkout, payment, refund, and access denied events

### Usage

```typescript
import {
  createAuditLog,
  OCSF_CLASS,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
} from '@unchainedshop/events';

// Create audit log instance (file-based)
const auditLog = createAuditLog('./audit-logs');

// Alternatively, replace the call above with HTTP push configuration:
/*
const auditLog = createAuditLog({
  directory: './audit-logs',
  collectorUrl: 'http://audit-collector:8080/events',
  batchSize: 10,
  flushIntervalMs: 5000,
});
*/

// Log authentication event
await auditLog.logAuthentication({
  activity: OCSF_AUTH_ACTIVITY.LOGON,
  userId: user._id,
  userName: user.emails?.[0]?.address,
  success: true,
  remoteAddress: req.ip,
  sessionId: req.sessionID,
  isMfa: true,
});

// Log failed login attempt
await auditLog.logAuthentication({
  activity: OCSF_AUTH_ACTIVITY.LOGON,
  userId: user._id,
  success: false,
  remoteAddress: req.ip,
  message: 'Invalid password',
});

// Log account change event
await auditLog.logAccountChange({
  activity: OCSF_ACCOUNT_ACTIVITY.ATTACH_POLICY, // Role change
  userId: targetUser._id,
  actorUserId: adminUser._id, // Who made the change
  success: true,
});

// Log user creation
await auditLog.logAccountChange({
  activity: OCSF_ACCOUNT_ACTIVITY.CREATE,
  userId: newUser._id,
  userName: newUser.emails?.[0]?.address,
  success: true,
});

// Log API activity (payments, orders, etc.)
await auditLog.logApiActivity({
  activity: OCSF_API_ACTIVITY.UPDATE,
  userId: user._id,
  operation: 'processPayment',
  success: true,
  remoteAddress: req.ip,
  message: 'Payment completed',
});

// Log access denied
await auditLog.logApiActivity({
  activity: OCSF_API_ACTIVITY.READ,
  userId: user._id,
  success: false,
  remoteAddress: req.ip,
  message: 'Access denied',
});

// Query audit logs
const logs = await auditLog.find({
  classUids: [OCSF_CLASS.AUTHENTICATION],
  userId: 'user-id',
  success: false,
  startTime: new Date('2024-01-01'),
  limit: 100,
});

// Get failed login attempts (for lockout policies)
const failedAttempts = await auditLog.getFailedLogins({
  remoteAddress: '192.168.1.1',
  since: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
});

// Verify integrity of audit log chain
const result = await auditLog.verify();
if (!result.valid) {
  console.error('Audit log tampering detected:', result.error);
}

// Close audit log (flushes pending events)
await auditLog.close();
```

### Automatic Event Integration

For automatic audit logging of all security-relevant events, use the integration layer:

```typescript
import { createAuditLog, configureAuditIntegration } from '@unchainedshop/events';

// Create audit log instance
const auditLog = createAuditLog('./audit-logs');

// Enable automatic event capture
configureAuditIntegration(auditLog);

// Events automatically captured:
// - API_LOGIN_TOKEN_CREATED → Authentication (LOGON)
// - API_LOGOUT → Authentication (LOGOFF)
// - USER_CREATE → Account Change (CREATE)
// - USER_REMOVE → Account Change (DELETE)
// - USER_UPDATE_PASSWORD → Account Change (PASSWORD_CHANGE)
// - USER_ADD_ROLES → Account Change (ATTACH_POLICY)
// - ORDER_CREATE → API Activity (CREATE)
// - ORDER_CHECKOUT → API Activity (CHECKOUT)
// - ORDER_ADD_PRODUCT → API Activity (UPDATE)
// - ORDER_PAY → API Activity (PAYMENT)
// - And more...

// After stopping event producers on shutdown
await auditLog.close();
```

### OCSF Event Classes

| Class | UID | Use Cases |
|-------|-----|-----------|
| **Authentication** | 3002 | Login, logout, failed login, MFA |
| **Account Change** | 3001 | User CRUD, password changes, role changes |
| **API Activity** | 6003 | API access, payments, orders, access denied |

### JSON Lines Format

Audit logs are stored as JSON Lines (one JSON object per line):

```json
{"class_uid":3002,"category_uid":3,"type_uid":300201,"activity_id":1,"severity_id":1,"time":1735570800000,"message":"User Login","user":{"uid":"user-123","name":"john@example.com"},"src_endpoint":{"ip":"192.168.1.1"},"status_id":1,"is_mfa":true,"metadata":{"version":"1.4.0","product":{"name":"Unchained Engine","version":"4.5"}},"unmapped":{"seq":42,"prev_hash":"abc123...","hash":"def456..."}}
```

### OCSF Activity Types

**Authentication Activities** (`OCSF_AUTH_ACTIVITY`):
| Activity | ID | Use Case |
|----------|-----|----------|
| `LOGON` | 1 | User login (success or failure) |
| `LOGOFF` | 2 | User logout |
| `OTHER` | 99 | Other authentication events |

**Account Change Activities** (`OCSF_ACCOUNT_ACTIVITY`):
| Activity | ID | Use Case |
|----------|-----|----------|
| `CREATE` | 1 | User creation |
| `PASSWORD_CHANGE` | 3 | Password changed by user |
| `PASSWORD_RESET` | 4 | Password reset by admin |
| `DELETE` | 6 | User deletion |
| `ATTACH_POLICY` | 7 | Role/permission changes |
| `MFA_ENABLE` | 10 | MFA enabled |
| `MFA_DISABLE` | 11 | MFA disabled |
| `OTHER` | 99 | Other account changes |

**API Activity Types** (`OCSF_API_ACTIVITY`):
| Activity | ID | Use Case |
|----------|-----|----------|
| `CREATE` | 1 | Create operations |
| `READ` | 2 | Read operations |
| `UPDATE` | 3 | Update operations |
| `DELETE` | 4 | Delete operations |
| `CHECKOUT` | 90 | Order checkout (e-commerce extension) |
| `PAYMENT` | 91 | Payment processing (e-commerce extension) |
| `REFUND` | 92 | Refund processing (e-commerce extension) |
| `EXPORT` | 93 | Data export (GDPR extension) |
| `IMPORT` | 94 | Data import (extension) |
| `ACCESS_DENIED` | 95 | Authorization failure (extension) |
| `OTHER` | 99 | Other API activities |

*Note: IDs 90-95 are Unchained-specific extensions. Standard OCSF defines activity_id 1-4 and 99 for API Activity. SIEM systems may display these as "Other" or "Unknown" unless configured to recognize the extended values.*

### OCSF Severity Levels

| Level | ID | Use Case |
|-------|----|----------|
| INFORMATIONAL | 1 | Normal operations (default for success) |
| LOW | 2 | Minor issues |
| MEDIUM | 3 | Standard operations |
| HIGH | 4 | Security-relevant events (default for failures) |
| CRITICAL | 5 | Critical security events |
| FATAL | 6 | System failures |

### SIEM Integration

Audit log files (`audit-YYYY-MM-DD.jsonl`) can be directly ingested by SIEM systems:

**Filebeat (Elastic):**
```yaml
filebeat.inputs:
  - type: log
    paths:
      - /path/to/audit-logs/*.jsonl
    json.keys_under_root: true
    json.add_error_key: true
```

**Promtail (Loki/Grafana):**
```yaml
scrape_configs:
  - job_name: unchained-audit
    static_configs:
      - targets: [localhost]
        labels:
          job: audit
          __path__: /path/to/audit-logs/*.jsonl
    pipeline_stages:
      - json:
          expressions:
            class_uid: class_uid
            activity_id: activity_id
            user_id: user.uid
```

**HTTP push:** The sender posts `application/json` with an `events` array of OCSF
records. Configure a receiver for that payload. It is not an OTLP log request;
forwarding to an OpenTelemetry OTLP receiver requires a translation step.

### Configuration

The audit log is configured programmatically. Example using environment variables:

```typescript
import { createAuditLog } from '@unchainedshop/events';

const auditLog = createAuditLog({
  directory: process.env.UNCHAINED_AUDIT_DIR || './audit-logs',
  collectorUrl: process.env.UNCHAINED_AUDIT_COLLECTOR_URL,
});
```

### Event Emission (Transient)

In addition to persistent audit logs, Unchained emits transient events for real-time processing:

- `USER_CREATE`, `USER_UPDATE`, `USER_REMOVE`
- `USER_UPDATE_PASSWORD`, `USER_ADD_ROLES`, `USER_UPDATE_ROLE`
- `USER_ACCOUNT_ACTION` (reset-password, verify-email, enroll-account)

```typescript
import { emit } from '@unchainedshop/events';

// Emit to the configured event adapters
await emit('USER_UPDATE_PASSWORD', { user });
```

When the events module is configured, it also persists event history in MongoDB.
Its retention is controlled by `EVENTS_TTL_SECONDS` (default: 172800, or 2 days).
This is separate from the file-based audit log.

## Rate Limiting

Rate limiting should be implemented at the **reverse proxy level** (nginx, Cloudflare, AWS ALB, etc.) rather than in the application layer.

### Recommended Configuration

**nginx example:**

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

server {
    # Rate limit all requests to the GraphQL endpoint
    location /graphql {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://unchained:4000;
    }
}
```

Both queries and mutations can use POST. This example limits the whole endpoint;
per-operation login limits require a GraphQL-aware gateway or application plugin.

**Cloudflare:**

- Use Rate Limiting Rules for `/graphql` endpoint
- Configure Bot Fight Mode
- Enable Under Attack Mode for emergencies

**AWS ALB:**

- Configure WAF rate-based rules
- Set thresholds per IP address

### Endpoints to Protect

| Endpoint | Recommended Limit | Rationale |
|----------|------------------|-----------|
| Login mutations | 5/minute per IP | Prevent brute force |
| Password reset | 3/hour per IP | Prevent enumeration |
| Registration | 10/hour per IP | Prevent spam |
| GraphQL queries | 100/second per IP | General protection |
| Bulk import | 1/minute per IP | Resource intensive |

## Deployment Recommendations

### Production Checklist

- [ ] Set `UNCHAINED_TOKEN_SECRET` to a strong, unique value (32+ chars)
- [ ] Enable HTTPS/TLS termination
- [ ] Configure MongoDB with authentication and TLS
- [ ] Configure encryption at rest for MongoDB/storage if storing sensitive data
- [ ] Configure rate limiting at reverse proxy (nginx, Cloudflare, ALB)
- [ ] Initialize `createAuditLog` and `configureAuditIntegration` from `@unchainedshop/events`; configure file retention and collection
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation for audit logs
- [ ] Regular security updates for dependencies

### Environment Hardening

```bash
# Required
UNCHAINED_TOKEN_SECRET=<strong-random-value-32+chars>
NODE_ENV=production

# Recommended
UNCHAINED_COOKIE_SAMESITE=strict
UNCHAINED_COOKIE_DOMAIN=.yourdomain.com

# For FIPS mode
OPENSSL_CONF=/etc/ssl/openssl-fips.cnf
```

### Network Security

1. **TLS 1.2+**: Enforce modern TLS versions
2. **HSTS**: Enable HTTP Strict Transport Security
3. **CSP**: Configure Content Security Policy for admin UI
4. **CORS**: Restrict allowed origins

### MongoDB Security

```bash
# Connection with authentication and TLS
MONGO_URL=mongodb://user:pass@host:27017/unchained?tls=true&authSource=admin
```

## Dependency Security

### Automated Scanning

Run regular dependency audits:

```bash
npm audit
npm audit fix
```

### Trusted Dependencies

The root manifest includes package-manager-specific trust metadata:

```json
{
  "trustedDependencies": ["@mongodb-js/zstd"]
}
```

Do not treat `trustedDependencies` as an npm lifecycle-script allowlist. Check the
package manager's script policy; the manifest also contains `allowScripts` entries
for Cypress and MongoDB Memory Server.

## Further Reading

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)
- [PCI SSC Document Library (current standards and SAQs)](https://www.pcisecuritystandards.org/document_library/)
- [ISO 27001](https://www.iso.org/standard/27001)
- [Chainguard FIPS Images](https://images.chainguard.dev/directory/image/node-fips/overview)
