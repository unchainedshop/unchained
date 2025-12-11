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
| `MAIL_URL` | - | SMTP connection URL (required in production) |
| `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` | `false` | Disable email interception in non-production |

## Features

- **Development Mode**: Automatically opens emails in browser instead of sending
- **Nodemailer Integration**: Full Nodemailer support for email transport
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
