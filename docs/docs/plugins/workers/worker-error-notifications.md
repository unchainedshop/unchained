---
sidebar_position: 47
title: Error Notifications Worker
sidebar_label: Error Notifications
description: Send daily reports about permanently failed work items
---

# Error Notifications Worker

Sends daily reports about work items that have permanently failed (exhausted all retries).

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ErrorNotificationsPlugin } from '@unchainedshop/plugins/worker/error-notifications';

pluginRegistry.register(ErrorNotificationsPlugin);
```

## Purpose

The Error Notifications Worker helps you stay informed about system issues by:

- Collecting permanently failed work items (no retries left) from the look-back window
- Triggering a MESSAGE work item with the `ERROR_REPORT` template
- Excluding its own failures to prevent notification loops

## Auto-Scheduling

Runs automatically every day at 03:00 (configured on registration) with `secondsPassed: 86400` — a 24-hour look-back.

## Manual Trigger

You can also trigger a report manually:

```graphql
mutation SendErrorReport {
  addWork(
    type: ERROR_NOTIFICATIONS
    input: {
      secondsPassed: 86400
    }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `secondsPassed` | Number | `60` | Seconds to look back (before the work item's scheduled time) for failed work items. The auto-scheduled run passes `86400`. |

## The ERROR_REPORT Template

The platform registers a default `ERROR_REPORT` template that emails a plain-text report. Configure it via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_ERROR_REPORT_RECIPIENT` | `support@unchained.local` | Recipient of the error report |
| `EMAIL_FROM` | `noreply@unchained.local` | Sender address |
| `EMAIL_WEBSITE_NAME` | `Unchained` | Shop name used in the subject and body |

To customize the report, re-register the template after `startPlatform`:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('ERROR_REPORT', async ({ workItems }) => {
  const summary = workItems.map(work =>
    `- ${work.type}: ${work.error?.message || 'Unknown error'}`
  ).join('\n');

  return [{
    type: 'EMAIL',
    input: {
      to: 'admin@example.com',
      subject: `[Unchained] ${workItems.length} failed work items`,
      text: `The following work items have permanently failed:\n\n${summary}`,
    },
  }];
});
```

## Result

```json
{
  "forked": "message-work-id"  // ID of the created MESSAGE work
}
```

If no failed work items are found, the result will be empty and no message is sent.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker.error-notifications` |
| Type | `ERROR_NOTIFICATIONS` |
| Auto-Schedule | Daily at 03:00 |
| Retries | 0 |
| Source | [worker/error-notifications](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/error-notifications) |

## Related

- [Message Worker](./worker-message.md)
- [Email Worker](./worker-email.md)
- [Plugins Overview](./)
