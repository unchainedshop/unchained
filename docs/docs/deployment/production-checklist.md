---
sidebar_position: 4
title: Production Checklist
sidebar_label: Production Checklist
description: Pre-launch checklist for Unchained Engine
---

# Production Checklist

Use this checklist to ensure your Unchained Engine deployment is production-ready.

## Security

For comprehensive security documentation, see the [Security Guide](./security).

### Authentication & Secrets

- [ ] **Token secret configured** - `UNCHAINED_TOKEN_SECRET` is set to a strong, unique value (minimum 32 characters)
- [ ] **Admin credentials secure** - Default admin password changed
- [ ] **API tokens rotated** - Any development tokens have been replaced

```bash
# Generate secure secrets
openssl rand -base64 32  # For UNCHAINED_TOKEN_SECRET
```

### Cryptographic Standards

Unchained uses industry-standard cryptography:

- **Password hashing**: PBKDF2-SHA512 with 300,000 iterations
- **Token storage**: SHA-256 hashed before database storage
- **Session encryption**: AES-256-GCM (optional)

### Network Security

- [ ] **HTTPS enforced** - All traffic uses TLS/SSL
- [ ] **CORS configured** - Only allowed origins can access the API
- [ ] **Rate limiting enabled** - Protection against abuse (implement at reverse proxy)
- [ ] **Firewall rules** - Only necessary ports are open

```typescript
// Example CORS configuration
await startPlatform({
  options: {
    cors: {
      origin: ['https://myshop.com', 'https://admin.myshop.com'],
      credentials: true,
    },
  },
});
```

### Audit Logging

- [ ] **Audit logging enabled** - OCSF-compliant audit logging configured
- [ ] **Log storage configured** - Audit logs persisted to file or SIEM
- [ ] **Integrity verification** - Hash chain verification scheduled

```typescript
import { createAuditLog, configureAuditIntegration } from '@unchainedshop/events';

const auditLog = createAuditLog({
  directory: process.env.UNCHAINED_AUDIT_DIR || './audit-logs',
  collectorUrl: process.env.UNCHAINED_AUDIT_COLLECTOR_URL,
});

configureAuditIntegration(auditLog);
```

### Database Security

- [ ] **Database file secured** - SQLite file has appropriate permissions (local) or Turso auth configured (cloud)
- [ ] **Network isolation** - Database not publicly accessible
- [ ] **Regular backups** - Automated backup schedule configured

## Performance

### Database

- [ ] **Indexes created** - All necessary indexes exist (auto-created on startup)
- [ ] **Query optimization** - No slow queries in production

### Caching

- [ ] **Redis configured** (if using) - For events and caching
- [ ] **CDN configured** - Static assets served from CDN
- [ ] **Browser caching** - Appropriate cache headers set

### Application

- [ ] **Production mode** - `NODE_ENV=production`
- [ ] **Memory limits** - Container/process memory limits set
- [ ] **Health checks** - Liveness and readiness probes configured

## Infrastructure

### Compute

- [ ] **Sufficient resources** - CPU and memory for expected load
- [ ] **Auto-scaling** - Scales based on demand (if applicable)
- [ ] **Multiple replicas** - No single point of failure

### Storage

- [ ] **File storage configured** - S3, MinIO, or local storage
- [ ] **Signed URLs** - Secure file access
- [ ] **Backup strategy** - Files and database are backed up

### Monitoring

- [ ] **Logging configured** - Centralized log collection
- [ ] **Error tracking** - Sentry or similar configured
- [ ] **Metrics collection** - Performance metrics tracked
- [ ] **Alerting** - Notifications for critical issues

```bash
# Logging configuration
LOG_LEVEL=info
LOG_FORMAT=json  # For structured logging
```

## Configuration

### Environment Variables

- [ ] **All required variables set** - See [Environment Variables](../platform-configuration/environment-variables)
- [ ] **No hardcoded secrets** - All secrets from environment
- [ ] **Separate environments** - Different configs for staging/production

### Essential Variables

```bash
# Required
NODE_ENV=production
ROOT_URL=https://api.myshop.com
DRIZZLE_DB_URL=libsql://your-db.turso.io
DRIZZLE_DB_TOKEN=your-turso-auth-token
UNCHAINED_TOKEN_SECRET=<32+ character secret>

# Email
MAIL_URL=smtp://...
EMAIL_FROM=noreply@myshop.com
EMAIL_WEBSITE_NAME=My Shop
EMAIL_WEBSITE_URL=https://myshop.com

# File Storage (when using MinIO plugin)
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=my-shop-files
```

### Payment Providers

- [ ] **Production API keys** - Not using test/sandbox keys
- [ ] **Webhooks configured** - Payment webhooks point to production
- [ ] **Webhook secrets set** - Webhook signatures are validated

```bash
# Stripe production
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Data

### Initial Data

- [ ] **Countries configured** - Active countries set up
- [ ] **Currencies configured** - Active currencies set up
- [ ] **Languages configured** - Active languages set up
- [ ] **Tax rates configured** - Correct tax rates for regions

### Products & Content

- [ ] **Products published** - All products have correct status
- [ ] **Prices set** - Products have prices in all currencies
- [ ] **Media uploaded** - Product images are uploaded
- [ ] **Translations complete** - Content in all languages

### Providers

- [ ] **Payment providers active** - At least one payment method
- [ ] **Delivery providers active** - At least one delivery method
- [ ] **Provider configuration** - All providers properly configured

## Email

### Configuration

- [ ] **SMTP configured** - `MAIL_URL` set correctly
- [ ] **From address set** - `EMAIL_FROM` configured
- [ ] **Templates customized** - Email templates match brand

### Testing

- [ ] **Order confirmation** - Email sends correctly
- [ ] **Password reset** - Reset flow works
- [ ] **Email preview disabled** - Not using built-in preview in production

```bash
# Disable email preview in production
EMAIL_PREVIEW=false  # or just don't set it
```

## Testing

### Functional Testing

- [ ] **Checkout flow** - Complete purchase works
- [ ] **Payment processing** - Real payments process correctly
- [ ] **Order management** - Orders can be managed in Admin UI
- [ ] **User registration** - Users can create accounts

### Load Testing

- [ ] **Performance baseline** - Know expected response times
- [ ] **Load tested** - System handles expected traffic
- [ ] **Stress tested** - Know system limits

### Error Handling

- [ ] **Error pages** - Custom error pages configured
- [ ] **Graceful degradation** - Handles partial failures
- [ ] **Error logging** - Errors are captured and reported

## Deployment Process

### CI/CD

- [ ] **Automated deployments** - Code deploys automatically
- [ ] **Testing pipeline** - Tests run before deployment
- [ ] **Rollback plan** - Can quickly revert if needed

### Database Migrations

- [ ] **Migrations tested** - Run on staging first
- [ ] **Backup before migration** - Database backed up
- [ ] **Rollback plan** - Can reverse migrations

## Documentation

### Internal

- [ ] **Deployment documented** - How to deploy
- [ ] **Configuration documented** - All config options
- [ ] **Runbooks** - How to handle common issues

### External

- [ ] **API documentation** - GraphQL schema documented
- [ ] **Integration guides** - For partners/developers

## Launch

### Pre-Launch

- [ ] **Staging tested** - Full test on staging environment
- [ ] **DNS configured** - Domains point to production
- [ ] **SSL certificates** - Valid certificates installed
- [ ] **Monitoring active** - All monitoring in place

### Launch Day

- [ ] **Team available** - Support team ready
- [ ] **Monitoring dashboard** - Real-time visibility
- [ ] **Communication plan** - How to communicate issues

### Post-Launch

- [ ] **Monitor closely** - Watch for issues first 24-48 hours
- [ ] **Gather feedback** - Note any issues for improvement
- [ ] **Document learnings** - Update runbooks

## Quick Verification Commands

```bash
# Check Node.js version
node --version  # Should be 22+

# Test database connection (Turso)
turso db shell your-db --execute "SELECT 1"

# Test SMTP
npm run test:email  # If you have this script

# Check environment variables
env | grep -E "UNCHAINED|DRIZZLE"

# Test API endpoint
curl https://api.myshop.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

## Related Documentation

- [Security Guide](./security) - Security features and compliance
- [Environment Variables](../platform-configuration/environment-variables) - Full configuration reference
- [Docker Deployment](./docker) - Container deployment
- [Audit Logging](../extend/events#audit-logging-ocsf) - OCSF audit logging
