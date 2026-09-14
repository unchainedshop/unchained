---
title: Environment Variables
description: Complete reference of all environment variables for configuring Unchained Engine core, API, file uploads, and worker settings.
---

# Environment Variables

This is the canonical reference of all environment variables used by Unchained Engine (excluding plugins and ticketing). Most of the plugins and extensions (like ticketing) have their own environment variables, check their docs individually.

Variables marked as **Required** are validated at boot by `startPlatform` — the process exits if they are missing.

## Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | - | Node environment (development, test, production). Affects caching, logging, and other behaviors |
| `PORT` | - | Base port number used by the application. MongoDB memory server uses PORT+1 |
| `MONGO_URL` | - | MongoDB connection URL. If absent, starts mongodb-memory-server in any environment: temporary storage in tests, persistent storage in `./.db` otherwise. Set an explicit URL in production |
| `UNCHAINED_API_VERSION` | `npm_package_version` or `n/a` | API version returned in GraphQL context. npm supplies `npm_package_version` when launched through a package script |
| `UNCHAINED_LANG` | `de` | Default language code |
| `UNCHAINED_COUNTRY` | `CH` | Default country code |
| `UNCHAINED_CURRENCY` | `CHF` | Default currency code |
| `DEBUG` | - | Debug namespace for detailed logging |
| `LOG_LEVEL` | `Info` | Log level (Error, Warn, Info, Verbose, Debug) |
| `UNCHAINED_LOG_FORMAT` | `unchained` | Log format type (`unchained` or `json`) |

## Security & Authentication

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `UNCHAINED_TOKEN_SECRET` | - | Yes | Secret key for signing session JWTs. Must be at least 32 characters long and kept secret, generate randomly by using `uuidgen` |
| `UNCHAINED_TOKEN_EXPIRY_SECONDS` | `3600` | No | Session token and cookie lifetime in seconds |
| `UNCHAINED_TOKEN_ISSUER` | `unchained-engine` | No | JWT issuer claim, validated on token verification |
| `UNCHAINED_SECRET` | - | No | Secret used for hashing token access keys (warehousing) and magic keys (ticketing) |
| `UNCHAINED_COOKIE_NAME` | `unchained_token` | No | Name of the session cookie |
| `UNCHAINED_COOKIE_PATH` | `/` | No | Cookie path |
| `UNCHAINED_COOKIE_DOMAIN` | - | No | Cookie domain restriction |
| `UNCHAINED_COOKIE_SAMESITE` | `lax` | No | SameSite cookie attribute (`strict`, `lax`, `none`, `1`, `0`) |
| `UNCHAINED_COOKIE_INSECURE` | - | No | Allow insecure cookies (set to any truthy value, defaults to secure) |

## Web Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `ROOT_URL` | - | Yes | Base URL of the application, used for generating absolute URLs |
| `EMAIL_WEBSITE_URL` | - | Yes | Frontend website URL, used in email templates and redirects |
| `EMAIL_WEBSITE_NAME` | - | Yes | Name of the website shown in emails and WebAuthn |

## Email Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `MAIL_URL` | - | No | SMTP connection URL for sending emails (e.g., `smtp://user:pass@host:port`) |
| `EMAIL_FROM` | - | Yes | Default sender email address |
| `EMAIL_ERROR_REPORT_RECIPIENT` | `support@unchained.local` | No | Email address for error reports |
| `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` | - | No | Disable email interception in non-production environments (set to any truthy value) |

## API Endpoints

| Variable | Default | Description |
|----------|---------|-------------|
| `BULK_IMPORT_API_PATH` | `/bulk-import` | Bulk import API endpoint path |
| `TEMP_UPLOAD_API_PATH` | `/temp-upload` | Temporary file upload API endpoint path |
| `MCP_API_PATH` | `/mcp` | Model Context Protocol API endpoint path |
| `ERC_METADATA_API_PATH` | `/erc-metadata` | ERC metadata API endpoint base path |


## Admin UI Customization

| Variable | Default | Description |
|----------|---------|-------------|
| `EXTERNAL_LINKS` | - | JSON string containing external links configuration for shop info |
| `UNCHAINED_ADMIN_UI_CUSTOM_PROPERTIES` | - | Path to a JSON file defining custom entity properties; overrides `adminUiConfig.customProperties` when the file can be read and parsed |
| `UNCHAINED_ADMIN_UI_SINGLE_SIGN_ON_URL` | - | Sign-in URL; overrides `adminUiConfig.singleSignOnURL` |
| `UNCHAINED_ADMIN_UI_DEFAULT_PRODUCT_TAGS` | - | Comma-separated product tags to include with existing tags |
| `UNCHAINED_ADMIN_UI_DEFAULT_ASSORTMENT_TAGS` | - | Comma-separated assortment tags to include with existing tags |
| `UNCHAINED_ADMIN_UI_DEFAULT_USER_TAGS` | - | Comma-separated user tags to include with existing tags |

## File Uploads and Filter Caching

| Variable | Default | Description |
|----------|---------|-------------|
| `UNCHAINED_PUT_URL_EXPIRY` | `86400000` (24 hours) | Validity of generated upload URLs in milliseconds |
| `UNCHAINED_FILTER_CACHE_TTL_MS` | `60000` (1 minute) | Lifetime of entries in the filter cache's in-process read cache, in milliseconds |

## Worker Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNCHAINED_WORKER_ID` | `os.hostname()` | Unique identifier for worker instance |
| `UNCHAINED_DISABLE_WORKER` | - | Disable worker system entirely (set to any truthy value) |
| `UNCHAINED_DISABLE_PROVIDER_INVALIDATION` | - | Disable provider invalidation on startup (set to any truthy value) |
| `UNCHAINED_ASSIGN_CART_FOR_USERS` | - | Automatically assign carts for users on startup (set to any truthy value) |
| `UNCHAINED_GUEST_USER_EXPIRY_DAYS` | `30` | Retention window in days for inactive guest users before the guest garbage-collection worker removes them. Sets the default for the `guestUserMaxAgeInDays` users-module setting |

## Events Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `EVENTS_TTL_SECONDS` | `172800` (2 days) | Retention period in seconds for records in the `events` collection (TTL index) |

## Audit Logging

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_SERVICE_NAME` | `unchained-engine` | Service name in exported audit events |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | - | Full OTLP logs endpoint; used when `auditLog.collectorUrl` is absent |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | - | Base OTLP endpoint; `/v1/logs` is appended when no explicit or logs-specific endpoint is configured |
| `OTEL_EXPORTER_OTLP_HEADERS` | - | Comma-separated `key=value` headers for the collector |
| `OTEL_EXPORTER_OTLP_LOGS_HEADERS` | - | Logs-specific headers overriding general OTLP headers; explicit `auditLog.collectorHeaders` take precedence |

See [Audit Logging](../extend/events.md#audit-logging-ocsf) for platform options and export behavior.

## Notes

- Email interception is enabled by default in non-production environments unless `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` is set
- Some variables have different behaviors in development vs production (see `NODE_ENV`)
