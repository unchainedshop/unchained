---
sidebar_position: 30
title: Email Worker
sidebar_label: Email
description: Email notification worker using Nodemailer
---

# Email Worker

Sends emails via Nodemailer. Requires the optional `nodemailer` package (`npm install nodemailer`).

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { EmailPlugin } from '@unchainedshop/plugins/worker/email';

pluginRegistry.register(EmailPlugin);
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_URL` | - | SMTP connection URL, e.g. `smtp://user:pass@smtp.example.com:587` (required in production) |
| `UNCHAINED_DISABLE_EMAIL_INTERCEPTION` | - | Set to disable email interception in non-production |

## Email Interception

Outside `NODE_ENV=production`, emails are not sent — they are written to a temp HTML file and opened in your browser for preview. Set `UNCHAINED_DISABLE_EMAIL_INTERCEPTION=true` to send real emails in development instead.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.email` |
| Type | `EMAIL` |
| Source | [worker/email](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/email) |

## Related

- [Messaging Configuration](../../platform-configuration/messaging.md)
- [Plugins Overview](./)
