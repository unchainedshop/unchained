# Environment Variables

This document provides a comprehensive list of all environment variables used by Unchained Engine (excluding plugins and ticketing). Most of the plugins and extensions (like ticketing) have their own environment variables, check their docs individually.

## Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | - | Node environment (development, test, production). Affects caching, logging, and other behaviors |
| `PORT` | - | Base port number used by the application. MongoDB memory server uses PORT+1 |
| `MONGO_URL` | - | MongoDB connection URL. If not set, uses mongodb-memory-server in development/test |
| `UNCHAINED_DOCUMENTDB_COMPAT_MODE` | - | Enable AWS DocumentDB compatibility mode (set to any truthy value to enable) |
| `UNCHAINED_API_VERSION` | `packageJson.version` | API version returned in GraphQL context, defaults to package.json version |
| `UNCHAINED_LANG` | `de` | Default language code |
| `UNCHAINED_COUNTRY` | `CH` | Default country code |
| `UNCHAINED_CURRENCY` | `CHF` | Default currency code |
| `DEBUG` | - | Debug namespace for detailed logging |
| `LOG_LEVEL` | `Info` | Log level (Error, Warn, Info, Verbose, Debug) |
| `UNCHAINED_LOG_FORMAT` | `unchained` | Log format type |

## Security & Authentication

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `UNCHAINED_SECRET` | - | Yes | Secret key used for signing magic keys and tokens. Must be kept secure |
| `UNCHAINED_TOKEN_SECRET` | - | Yes | Secret key for session tokens. Must be at least 32 characters long and kept secret, generate randomly by using `uuidgen` |
| `UNCHAINED_COOKIE_NAME` | `unchained_token` | Yes | Name of the session cookie |
| `UNCHAINED_COOKIE_PATH` | `/` | Yes |Cookie path |
| `UNCHAINED_COOKIE_DOMAIN` | - | No |Cookie domain restriction |
| `UNCHAINED_COOKIE_SAMESITE` | `false` | No |SameSite cookie attribute (strict, lax, none, or false) |
| `UNCHAINED_COOKIE_INSECURE` | - | No |Allow insecure cookies (set to any truthy value, defaults to secure) |
## Web Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `ROOT_URL` | `http://localhost:4010` | Yes | Base URL of the application, used for generating absolute URLs |
| `EMAIL_WEBSITE_URL` | - | Yes | Frontend website URL, used in email templates and redirects |
| `EMAIL_WEBSITE_NAME` | `Unchained` | Yes | Name of the website shown in emails and WebAuthn |

## Email Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `MAIL_URL` | - | - | SMTP connection URL for sending emails (e.g., `smtp://user:pass@host:port`) |
| `EMAIL_FROM` | `noreply@unchained.local` | Yes | Default sender email address |
| `EMAIL_ERROR_REPORT_RECIPIENT` | `support@unchained.local` | - | Email address for error reports |
| `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` | - | - | Disable email interception in non-production environments (set to any truthy value) |

## API Endpoints

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAPHQL_API_PATH` | `/graphql` | GraphQL API endpoint path |
| `BULK_IMPORT_API_PATH` | `/bulk-import` | Bulk import API endpoint path |
| `TEMP_UPLOAD_API_PATH` | `/temp-upload` | Temporary file upload API endpoint path |
| `MCP_API_PATH` | `/mcp` | Model Context Protocol API endpoint path |
| `ERC_METADATA_API_PATH` | `/erc-metadata/:productId/:localeOrTokenFilename/:tokenFileName?` | ERC metadata API endpoint path pattern |


## Admin UI Customization

| Variable | Default | Description |
|----------|---------|-------------|
| `EXTERNAL_LINKS` | - | JSON string containing external links configuration for shop info |

## Worker Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UNCHAINED_WORKER_ID` | `os.hostname()` | Unique identifier for worker instance |
| `UNCHAINED_DISABLE_WORKER` | - | Disable worker system entirely (set to any truthy value) |
| `UNCHAINED_DISABLE_PROVIDER_INVALIDATION` | - | Disable provider invalidation on startup (set to any truthy value) |
| `UNCHAINED_ASSIGN_CART_FOR_USERS` | - | Automatically assign carts for users on startup (set to any truthy value) |

## Notes

- Environment variables marked as "Required" must be set for the application to start properly
- In production, ensure all security-related variables are properly set with strong values
- Some variables have different behaviors in development vs production (see `NODE_ENV`)
- Email interception is enabled by default in non-production environments unless disabled
- Cookie security settings should be carefully configured for production deployments