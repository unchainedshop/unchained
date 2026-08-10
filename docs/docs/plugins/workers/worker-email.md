---
sidebar_position: 30
title: Email Worker
sidebar_label: Email
description: Email notification worker using Nodemailer
---

# Email Worker

Handles email notifications using Nodemailer with development-friendly features.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/email';
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_URL` | - | One or more whitespace-separated SMTP connection URLs (required in production). Additional URLs act as fallbacks. |
| `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` | `false` | Disable email interception in non-production |

## Features

- **Development Mode**: Automatically opens emails in browser instead of sending
- **Nodemailer Integration**: Full Nodemailer support for email transport
- **Transport Fallback**: Multiple SMTP services tried in order until one accepts the mail
- **HTML/Text Support**: Handles both HTML and plain text emails
- **Attachment Support**: Full attachment support with various encoding options
- **Email Preview**: Browser-based email preview for development

## Configuration

Configure the MAIL_URL for your SMTP provider:

```bash
# Gmail
MAIL_URL=smtp://user:pass@smtp.gmail.com:587

# Mailgun
MAIL_URL=smtp://postmaster@mg.example.com:password@smtp.mailgun.org:587

# SendGrid
MAIL_URL=smtp://apikey:SG.xxx@smtp.sendgrid.net:587
```

## Failover with Multiple SMTP Services

`MAIL_URL` accepts multiple whitespace-separated connection URLs. They are tried in order per email — if a transport fails to send (connection error, authentication failure, SMTP reject), the next URL is tried until one succeeds:

```bash
MAIL_URL="smtp://user:pass@smtp.primary.example:587 smtp://apikey:SG.xxx@smtp.sendgrid.net:587"
```

Whitespace includes newlines, so multiline YAML works in compose files:

```yaml
environment:
  MAIL_URL: >-
    smtp://user:pass@smtp.primary.example:587
    smtp://apikey:SG.xxx@smtp.sendgrid.net:587
```

Whitespace is used as the separator because it can never appear unencoded inside a valid URL — unlike commas, which are legal characters in passwords and query parameters.

When a fallback transport was used, the work item result contains the winning `transport` (credentials stripped) and the `failedAttempts` that preceded it, and each failover is logged as a warning.

:::warning Deliverability
Every listed SMTP service sends on behalf of your from-domain: the domain's SPF record must authorize **all** of them, and DKIM must be configured per service — otherwise failover mail is likely to be classified as spam.
:::

## Development vs Production

### Development

In non-production environments, emails are intercepted and opened in the browser for preview. This prevents accidental emails to real users during development.

To disable interception:

```bash
UNCHAINED_DISABLE_EMAIL_INTERCEPTION=true
```

### Production

In production (`NODE_ENV=production`), emails are sent through the configured SMTP transport.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.email` |
| Source | [worker/email.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/email.ts) |

## Related

- [Messaging Configuration](../../platform-configuration/messaging.md)
- [Plugins Overview](./)
