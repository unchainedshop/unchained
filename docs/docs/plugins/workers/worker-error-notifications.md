---
sidebar_position: 47
title: Error Notifications Worker
sidebar_label: Error Notifications
description: Send daily reports about permanently failed work items
---

# Error Notifications Worker

Sends daily reports about work items that have permanently failed (exhausted all retries).

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/error-notifications';
```

## Purpose

The Error Notifications Worker helps you stay informed about system issues by:

- Running automatically every day at 3 AM UTC
- Collecting all permanently failed work items from the past 24 hours
- Triggering a MESSAGE work item with the `ERROR_REPORT` template
- Excluding its own failures to prevent notification loops

## Auto-Scheduling

When imported, this worker automatically schedules itself to run daily at 03:00 UTC.

## Manual Trigger

You can also trigger a report manually:

```graphql
mutation SendErrorReport {
  createWork(
    type: "ERROR_NOTIFICATIONS"
    input: {
      secondsPassed: 86400  # Look back 24 hours (optional)
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
| `secondsPassed` | Number | `86400` | Seconds to look back for failed work items |

## Setting Up the Template

To receive error notifications, you need to register an `ERROR_REPORT` template:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('ERROR_REPORT', async ({ workItems }, context) => {
  const adminEmail = 'admin@example.com';

  const summary = workItems.map(work =>
    `- ${work.type}: ${work.error?.message || 'Unknown error'}`
  ).join('\n');

  return [{
    type: 'EMAIL',
    input: {
      to: adminEmail,
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
| Auto-Schedule | Daily at 03:00 UTC |
| Retries | 0 |
| Source | [worker/error-notifications.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/error-notifications.ts) |

## Related

- [Message Worker](./worker-message.md)
- [Email Worker](./worker-email.md)
- [Plugins Overview](./)
