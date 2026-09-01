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
| **FIPS 140-3** | Algorithm Compatible | Uses FIPS-approved algorithms (PBKDF2, SHA-256/512, AES-256-GCM). Requires FIPS-validated runtime for full compliance. |
| **SOC 2** | Audit Support | Emits an OCSF audit event stream for evidence collection in your SIEM. SOC 2 audits evaluate your organization's controls, not software. |
| **FINMA 2023/1** | Technical Controls | Audit logging, access control, and cryptography support ICT risk management requirements. The circular is principle-based; organizational controls are your responsibility. |
| **GDPR** | Technical Measures | Audit logging supports Article 30 requirements. Data protection policies are your responsibility. |

## Cryptographic Standards

Unchained Engine uses modern, standards-compliant cryptography throughout:

### Password Hashing

- **Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 300,000 (exceeds OWASP recommendation of 210,000)
- **Salt**: 16 bytes, cryptographically random
- **Key Length**: 256 bytes
- **Implementation**: Web Crypto API (`crypto.subtle`)

```typescript
// packages/core-users/src/module/pbkdf2.ts
const PBKDF2_ITERATIONS = 300000;
const PBKDF2_KEY_LENGTH = 256;
const PBKDF2_SALT_LENGTH = 16;
// Uses SHA-512 via crypto.subtle.deriveBits()
```

### Token Security

- **Token Generation**: `crypto.randomUUID()` (CSPRNG-based, 128 bits of entropy)
- **Token Storage**: SHA-256 hashed before database storage
- **Token Expiration**: Time-limited (1 hour for verification tokens)
- **Single Use**: Tokens are invalidated after use

**Why SHA-256 for Tokens (not PBKDF2)?**

Per [OWASP guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), slow hashing algorithms (bcrypt, PBKDF2, Argon2) are designed for low-entropy user passwords. API access tokens generated with CSPRNG have high entropy (128+ bits), making brute-force computationally infeasible regardless of hash speed. Using SHA-256 for high-entropy tokens is both secure and performant for stateless API authentication where every request must be verified.

```typescript
// packages/core-users/src/module/configureUsersModule.ts
// Preferred: Server generates high-entropy token
const result = await modules.users.createAccessToken('admin');
console.log(result.token); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

### Random Number Generation

- **Hash IDs**: Generated using `crypto.getRandomValues()` (CSPRNG)
- **Nonces**: `crypto.randomUUID()` for WebAuthn/Web3 challenges
- **No weak RNG**: `Math.random()` is never used for security-sensitive operations

### Session Encryption (Optional)

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Size**: 32 bytes
- **IV Size**: 16 bytes
- **Implementation**: kruptein library

### Payment Signature Verification

- **HMAC-SHA-256**: Datatrans, Payrexx, Saferpay, GridFS uploads
- **HMAC-SHA-512**: PostFinance Checkout

### WebAuthn/FIDO2

Full support for passwordless authentication via the WebAuthn standard, enabling hardware security keys and platform authenticators.

## FIPS 140-3 Compatibility

Unchained Engine uses FIPS 140-3 approved algorithms and can run on FIPS-validated runtimes. **Note**: The software itself is not FIPS-validated; validation requires certification by a NIST-accredited lab. For true FIPS compliance, deploy on a FIPS-validated runtime.

### FIPS-Approved Algorithms Used

All cryptographic operations in Unchained use FIPS 140-3 approved algorithms:

| Operation | Algorithm | FIPS Status |
|-----------|-----------|-------------|
| Password Hashing | PBKDF2-SHA-512 | Approved |
| Token Hashing | SHA-256 | Approved |
| Session Encryption | AES-256-GCM | Approved |
| Payment Signatures | HMAC-SHA-256/512 | Approved |
| Random Generation | CSPRNG | Approved |

### Running in FIPS Mode

#### Option 1: Chainguard FIPS Image (Recommended)

Use the [Chainguard node-fips](https://images.chainguard.dev/directory/image/node-fips/overview) container image which includes a FIPS-validated OpenSSL module:

```dockerfile
FROM cgr.dev/chainguard/node-fips:latest

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# FIPS mode is enabled by default in this image
CMD ["node", "index.js"]
```

#### Option 2: Node.js with OpenSSL FIPS Provider

Build or use a Node.js binary compiled with OpenSSL 3.x FIPS provider:

```bash
# Enable FIPS mode via environment variable
export OPENSSL_CONF=/path/to/openssl-fips.cnf
node --enable-fips your-app.js
```

Example `openssl-fips.cnf`:
```ini
openssl_conf = openssl_init

[openssl_init]
providers = provider_sect
alg_section = algorithm_sect

[provider_sect]
fips = fips_sect
base = base_sect

[fips_sect]
activate = 1

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

### FIPS-Approved Algorithms

All cryptographic operations in Unchained use FIPS 140-3 approved algorithms:

| Operation | Algorithm | FIPS Status |
|-----------|-----------|-------------|
| Password Hashing | PBKDF2-SHA-512 | Approved |
| Token Hashing | SHA-256 | Approved |
| Session Encryption | AES-256-GCM | Approved |
| Payment Signatures | HMAC-SHA-256/512 | Approved |
| Random Generation | CSPRNG | Approved |

### FIPS Considerations

1. **Pure PBKDF2**: Unchained uses only PBKDF2-SHA512 for password hashing, ensuring full FIPS 140-3 compatibility for all password operations.

2. **Third-Party Libraries**: Verify that any additional npm packages you add use Node.js crypto APIs or are otherwise FIPS-compliant.

3. **Cryptopay Plugin**: Uses `@noble/curves` and `@noble/hashes` for cryptocurrency operations. These implement FIPS-approved primitives but are not FIPS-certified modules.

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
{
  httpOnly: true,           // Prevent XSS access
  secure: true,             // HTTPS only (unless explicitly disabled)
  sameSite: 'lax',          // OWASP: CSRF protection
  maxAge: 3600 * 1000,      // follows UNCHAINED_TOKEN_EXPIRY_SECONDS (1 hour default)
}
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `UNCHAINED_TOKEN_SECRET` | Session encryption (min 32 chars) | Required |
| `UNCHAINED_COOKIE_NAME` | Cookie name | `unchained_token` |
| `UNCHAINED_COOKIE_DOMAIN` | Cookie domain restriction | - |
| `UNCHAINED_COOKIE_SAMESITE` | SameSite attribute | `lax` |
| `UNCHAINED_COOKIE_INSECURE` | Disable secure flag (development only) | `false` |

## Error Handling

Errors are designed to prevent information leakage:

- **Authentication errors**: Generic "Invalid credentials" message
- **Token errors**: "Token invalid or expired" (doesn't distinguish)
- **Permission errors**: "Not authorized" (no action details)
- **Password validation**: "Too insecure" (no requirements revealed)
- **User enumeration prevention**: Password reset returns success regardless of user existence
- **Log sanitization**: Error objects are never logged directly; only message and name are captured

## Input Validation

### ReDoS Prevention

All user-supplied strings used in regular expressions are escaped to prevent Regular Expression Denial of Service (ReDoS) attacks:

```typescript
import { escapeRegexString } from '@unchainedshop/mongodb';

// User input is escaped before regex construction
const regex = new RegExp(escapeRegexString(userInput), 'i');
```

The `escapeRegexString` function escapes all special regex characters (`[-/\\^$*+?.()|[\]{}]`) and includes:
- Type validation (throws TypeError for non-strings)
- Length limits (max 255 characters)
- Empty string rejection

### Query String Validation

All query builder functions that accept user input for text search apply proper escaping to prevent injection attacks.

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

Unchained provides audit event emission based on the **OCSF (Open Cybersecurity Schema Framework)**. OCSF is an industry-standard schema developed by 120+ organizations (AWS, Splunk, IBM) and is now a Linux Foundation project. It is natively supported by AWS Security Lake, Google Chronicle, Datadog, Elastic, and other SIEM systems.

The engine does not persist audit events itself — retention, queries, and integrity guarantees are the consuming log pipeline's or SIEM's concern.

### Features

- **OCSF-based schema** - Schema-conformant OCSF v1.4.0 events with e-commerce activity names
- **Structured log emission** - Every event as one JSON log line on stdout (default), scrapeable by any log agent
- **OTLP push** - Optional OTLP/HTTP push to OpenTelemetry Collector, Vector, Fluent Bit, or vendor intakes
- **SIEM-ready** - Direct ingestion into security monitoring tools
- **Event integration** - Automatic capture of authentication, orders, and payments
- **E-commerce specific** - Checkout, payment, refund, and access denied events

### Usage

Audit logging is enabled by default in `startPlatform()`; OTLP push is opt-in:

```typescript
import { startPlatform } from '@unchainedshop/platform';

const platform = await startPlatform({
  modules: defaultModules,
  auditLog: {
    collectorUrl: 'http://otel-collector:4318/v1/logs', // optional OTLP push
  },
});
```

For custom audit events, use the singleton instance:

```typescript
import {
  getAuditLogInstance,
  OCSF_AUTH_ACTIVITY,
  OCSF_ACCOUNT_ACTIVITY,
  OCSF_API_ACTIVITY,
} from '@unchainedshop/events';

const auditLog = getAuditLogInstance();

// Log authentication event
await auditLog.logAuthentication({
  activity: OCSF_AUTH_ACTIVITY.LOGON,
  userId: user._id,
  userName: user.email,
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
  userName: newUser.email,
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
```

### Automatic Event Integration

`startPlatform()` wires the integration layer automatically — no manual setup is needed. Events automatically captured (97 event types, see `AUDITED_EVENTS`):

- `API_LOGIN_TOKEN_CREATED` → Authentication (LOGON)
- `API_LOGIN_FAILED` → Authentication (LOGON, failure)
- `API_LOGOUT` → Authentication (LOGOFF)
- `USER_CREATE` → Account Change (CREATE)
- `USER_REMOVE` → Account Change (DELETE)
- `USER_UPDATE_PASSWORD` → Account Change (PASSWORD_CHANGE)
- `USER_ADD_ROLES` → Account Change (ATTACH_POLICY)
- `ORDER_CREATE` → API Activity (CREATE)
- `ORDER_CHECKOUT` → API Activity (CHECKOUT)
- `ORDER_ADD_PRODUCT` → API Activity (UPDATE)
- `ORDER_PAY` → API Activity (PAYMENT)
- And more...

Shutdown (flushing pending collector batches) is handled by the platform's cleanup path.

### OCSF Event Classes

| Class | UID | Use Cases |
|-------|-----|-----------|
| **Authentication** | 3002 | Login, logout, failed login, MFA |
| **Account Change** | 3001 | User CRUD, password changes, role changes |
| **API Activity** | 6003 | API access, payments, orders, access denied |

### Structured Log Emission

With `UNCHAINED_LOG_FORMAT=json`, every audit event is emitted as one JSON line on stdout via the `unchained:audit` logger, with the full OCSF event under the `ocsf` key:

```json
{"timestamp":"2026-09-01T09:12:00.000Z","level":"INFO","name":"unchained:audit","message":"User Login","ocsf":{"class_uid":3002,"category_uid":3,"type_uid":300201,"activity_id":1,"severity_id":1,"time":1788253920000,"user":{"uid":"user-123","name":"john@example.com"},"src_endpoint":{"ip":"192.168.1.1"},"status_id":1,"is_mfa":true,"metadata":{"version":"1.4.0","product":{"name":"Unchained Engine"}}}}
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

*Note: IDs 90-95 are internal Unchained identifiers. Standard OCSF defines activity_id 0-4 and 99 for API Activity, so emitted events carry `activity_id: 99` (Other) with the specific label in the standard `activity_name` attribute (e.g. "Checkout") — fully schema-conformant, with fine-grained semantics also available in `api.operation`.*

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

Two vendor-neutral paths reach any SIEM:

**1. Scrape stdout** — run the engine with `UNCHAINED_LOG_FORMAT=json` and let a log agent tail the container output. Example OpenTelemetry Collector configuration:

```yaml
receivers:
  filelog:
    include: [/var/log/containers/unchained-*.log]
    operators:
      - type: json_parser
      - type: filter
        expr: 'attributes.name != "unchained:audit"'

exporters:
  elasticsearch:
    endpoints: ["https://es:9200"]

service:
  pipelines:
    logs:
      receivers: [filelog]
      exporters: [elasticsearch]
```

Vector, Fluent Bit, Promtail/Alloy, Filebeat and vendor agents work the same way: parse the JSON line and route on `name == "unchained:audit"`.

**2. OTLP push** — the engine pushes OTLP/HTTP log records directly to a collector:

```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318

exporters:
  elasticsearch:
    endpoints: ["https://es:9200"]

service:
  pipelines:
    logs:
      receivers: [otlp]
      exporters: [elasticsearch]
```

### Configuration

The audit log is configured via `startPlatform({ auditLog: {...} })`; the OTLP push also honors the standard OpenTelemetry environment variables:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318   # /v1/logs is appended
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=...                     # used verbatim, wins over the above
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer%20abc"  # key=value,key=value
OTEL_SERVICE_NAME=my-shop                                # service.name resource attribute
```

| Option | Default | Description |
|--------|---------|-------------|
| `log` | `true` | Emit each event as a structured log line |
| `collectorUrl` | `OTEL_EXPORTER_OTLP_*` env | OTLP/HTTP logs endpoint |
| `collectorHeaders` | env headers | HTTP headers for collector auth |
| `batchSize` | `10` | Events batched before pushing |
| `flushIntervalMs` | `5000` | Max interval between pushes |
| `maxQueueSize` | `1000` | Push queue cap (oldest dropped beyond it) |

### Event Emission (Transient)

In addition to audit events, Unchained emits transient events for real-time processing:

- `USER_CREATE`, `USER_UPDATE`, `USER_REMOVE`
- `USER_UPDATE_PASSWORD`, `USER_UPDATE_ROLES`
- `USER_ACCOUNT_ACTION` (reset-password, verify-email, enroll-account)

```typescript
import { emit } from '@unchainedshop/events';

// Transient events (2-day TTL in MongoDB)
await emit('USER_UPDATE_PASSWORD', { user });
```

## Rate Limiting

Rate limiting should be implemented at the **reverse proxy level** (nginx, Cloudflare, AWS ALB, etc.) rather than in the application layer.

### Recommended Configuration

**nginx example:**

```nginx
# Define rate limit zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

server {
    # Rate limit login/auth endpoints
    location /graphql {
        # Stricter limits for mutations (detected via POST)
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://unchained:4000;
    }
}
```

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
- [ ] Enable session encryption if storing sensitive data
- [ ] Configure rate limiting at reverse proxy (nginx, Cloudflare, ALB)
- [ ] Enable audit logging via `modules.auditLog` (built-in, persisted indefinitely)
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

The project explicitly trusts only necessary native modules:

```json
{
  "trustedDependencies": ["@mongodb-js/zstd"]
}
```

## Further Reading

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [NIST FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final)
- [PCI DSS SAQ-A](https://www.pcisecuritystandards.org/documents/SAQ_A_v3.pdf)
- [ISO 27001](https://www.iso.org/standard/27001)
- [Chainguard FIPS Images](https://images.chainguard.dev/directory/image/node-fips/overview)
