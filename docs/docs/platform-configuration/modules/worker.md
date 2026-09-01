---
sidebar_position: 10
sidebar_label: Worker
title: Worker Module
description: Background job processing and security configuration
---

# Worker Module

The worker module manages background job processing and work queue security.

## Configuration Options

```typescript
export interface WorkerSettingsOptions {
  blacklistedVariables?: string[];
}
```

### Blacklisting Variables

Security Feature.

You can provide a custom list of blacklisted variables, keys which are part of the blacklist will be obfuscated with `******` in Work Queue APIs and when publishing Events.

Example custom configuration:

```typescript
await startPlatform({
  options: {
    worker: {
      blacklistedVariables: ['secret-key'],
    },
  },
});
```

If `blacklistedVariables` is not configured, nothing is obfuscated: [buildObfuscatedFieldsFilter](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/build-obfuscated-fields-filter.ts)

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `WORK_ADDED` | work item | Emitted when work is added to the queue |
| `WORK_ALLOCATED` | work item | Emitted when work is allocated to a worker |
| `WORK_FINISHED` | work item | Emitted when work finishes (success or failure) |
| `WORK_DELETED` | work item | Emitted when work is deleted |
| `WORK_RESCHEDULED` | `{ work, oldScheduled }` | Emitted when work is rescheduled |

Payloads are the work item with blacklisted input variables obfuscated.

## More Information

For API usage and detailed documentation, see the [core-worker package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-worker).
