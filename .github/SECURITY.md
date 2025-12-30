# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 4.x     | :white_check_mark: |
| 3.x     | :x:                |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to **security@unchained.shop** with:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** (if you have one)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Resolution Timeline**: We aim to resolve critical vulnerabilities within 30 days
- **Credit**: We will credit you in our security advisories (unless you prefer to remain anonymous)

### Scope

The following are in scope for security reports:

- Unchained Engine core packages (`@unchainedshop/*`)
- Official plugins included in `@unchainedshop/plugins`
- Admin UI (`admin-ui/`)
- Example applications (security issues that could affect production use)

### Out of Scope

- Third-party dependencies (please report to the respective maintainers)
- Theoretical vulnerabilities without proof of concept
- Social engineering attacks
- Denial of service attacks

## Security Best Practices

When deploying Unchained Engine in production:

1. **Environment Variables**: Never commit secrets to version control
2. **Database Access**: Restrict MongoDB access to application servers only
3. **API Authentication**: Enable authentication for all production GraphQL endpoints
4. **File Uploads**: Configure allowed file types and size limits
5. **Rate Limiting**: Implement rate limiting on your API gateway
6. **Updates**: Keep dependencies updated, especially security patches

## Public Disclosure

We follow coordinated disclosure:

1. Security issues are fixed in a private branch
2. A new version is released with the fix
3. Security advisory is published after users have had time to update
4. Credit is given to the reporter (if desired)

## Security Advisories

Security advisories are published on:
- [GitHub Security Advisories](https://github.com/unchainedshop/unchained/security/advisories)
- Our documentation site

## Contact

- Security issues: security@unchained.shop
- General inquiries: hello@unchained.shop
