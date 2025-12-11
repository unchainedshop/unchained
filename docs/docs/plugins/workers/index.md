---
sidebar_position: 7
title: Worker Plugins
sidebar_label: Workers
description: Background worker plugins for Unchained Engine
---

# Worker Plugins

Worker plugins handle background tasks like notifications, data processing, and scheduled jobs.

## Base Preset Workers

These workers are automatically loaded when using the `base` preset and are strongly recommended for proper system operation:

| Adapter Key | Type | Description |
|-------------|------|-------------|
| [`shop.unchained.worker-plugin.message`](./worker-message.md) | `MESSAGE` | Routes messages through templates to delivery workers |
| [`shop.unchained.worker-plugin.email`](./worker-email.md) | `EMAIL` | Email notifications via Nodemailer |
| [`shop.unchained.worker-plugin.http-request`](./worker-http-request.md) | `HTTP_REQUEST` | Outbound HTTP webhooks |
| [`shop.unchained.worker-plugin.bulk-import`](./worker-bulk-import.md) | `BULK_IMPORT` | Bulk data import from JSON streams |
| [`shop.unchained.worker-plugin.external`](./worker-external.md) | `EXTERNAL` | Placeholder for external workers |
| [`shop.unchained.worker-plugin.heartbeat`](./worker-heartbeat.md) | `HEARTBEAT` | System health check |
| [`shop.unchained.worker-plugin.zombie-killer`](./worker-zombie-killer.md) | `ZOMBIE_KILLER` | Cleanup orphaned database records |
| [`shop.unchained.worker.error-notifications`](./worker-error-notifications.md) | `ERROR_NOTIFICATIONS` | Daily error reports |

## SMS Workers

| Adapter Key | Type | Description |
|-------------|------|-------------|
| [`shop.unchained.worker-plugin.twilio`](./twilio.md) | `TWILIO` | SMS via Twilio |
| [`shop.unchained.worker-plugin.bulkgate`](./worker-bulkgate.md) | `BULKGATE` | SMS via BulkGate |
| [`shop.unchained.worker-plugin.budgetsms`](./worker-budgetsms.md) | `BUDGETSMS` | SMS via BudgetSMS |

## Push Notifications

| Adapter Key | Type | Description |
|-------------|------|-------------|
| [`shop.unchained.worker-plugin.push-notification`](./push-notification.md) | `PUSH` | W3C Web Push notifications |

## Currency Rate Workers

| Adapter Key | Type | Description |
|-------------|------|-------------|
| [`shop.unchained.worker.update-ecb-rates`](./worker-update-ecb-rates.md) | `UPDATE_ECB_RATES` | EUR exchange rates from ECB |
| [`shop.unchained.worker.update-coinbase-rates`](./worker-update-coinbase-rates.md) | `UPDATE_COINBASE_RATES` | Crypto/fiat rates from Coinbase |

## Enrollment Workers

| Adapter Key | Type | Description |
|-------------|------|-------------|
| [`shop.unchained.worker-plugin.generate-enrollment-orders`](./worker-enrollment-order-generator.md) | `ENROLLMENT_ORDER_GENERATOR` | Generate orders from subscriptions |

## Token/NFT Workers

| Adapter Key | Type | Description |
|-------------|------|-------------|
| [`shop.unchained.worker-plugin.export-token`](./worker-export-token.md) | `EXPORT_TOKEN` | Token minting/export process |
| [`shop.unchained.worker-plugin.refresh-tokens`](./worker-token-ownership.md) | `REFRESH_TOKENS` | Refresh token ownership data |
| [`shop.unchained.worker-plugin.update-token-ownership`](./worker-token-ownership.md) | `UPDATE_TOKEN_OWNERSHIP` | External token ownership verification |

## Creating Custom Worker Plugins

See [Custom Worker Plugins](../../extend/worker.md) for creating your own worker adapters.
