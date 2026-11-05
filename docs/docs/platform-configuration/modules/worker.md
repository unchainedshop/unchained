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

The values of blacklisted keys are obfuscated with `******`, at any depth of the work's `input`, `result` and `error`, in Work Queue APIs (`Work.input`, `Work.result`, `Work.error` and the MCP work tools) and when publishing Events. Keys match case-insensitively.

If `blacklistedVariables` is not configured, the keys of `defaultObfuscatedFields` from `@unchainedshop/utils` are obfuscated: `password`, `newPassword`, `oldPassword`, `authorization`, `secret`, `accessKey`, `accessToken` and `token`. A custom list replaces them, `[]` obfuscates nothing. To add keys, spread the defaults:

```typescript
import { defaultObfuscatedFields } from '@unchainedshop/utils';

await startPlatform({
  options: {
    worker: {
      blacklistedVariables: [...defaultObfuscatedFields, 'secret-key'],
    },
  },
});
```

A blacklisted key that holds a plain object (for example the warehousing token in the input of `EXPORT_TOKEN` work) keeps it and has its keys obfuscated in turn. The work queue stores and processes the plain values: worker adapters and the work returned by `modules.worker` see them. Event subscribers that need them, like the retries of failed work, read the work with `modules.worker.findWork({ workId })`. See [buildObfuscatedFieldsFilter](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/build-obfuscated-fields-filter.ts).

## Retention

Work is deleted 30 days after it was created or is scheduled to run, whichever is later, whatever its status. Each work item stores that date as `expires`, and a TTL index on `expires` deletes it. `addWork`, `ensureOneWork` (autoscheduling) and `rescheduleWork` set it with `computeWorkExpiry({ created, scheduled })` (`WORK_RETENTION_SECONDS` is 30 days), so work scheduled more than 30 days ahead runs before it expires.

Older versions deleted work 30 days after `created`, even work that had not run yet. Migration `20261104120100` gives existing work its `expires` date and then drops the old TTL index `created_-1` (see MIGRATION.md).

## Scrubbing Finished Input

Finished work keeps its input until it expires. For mails that means 30 days of recipient addresses, texts and links, account links with their tokens included. `modules.worker.scrubWorkInput({ types, before, keep })` takes the work of the given `types` that finished or was deleted before `before` (it will not run again), replaces its input with only its `keep` keys (default none) and sets `scrubbed` to the time of the scrub. It returns the number of scrubbed work items and leaves work that was already scrubbed alone. Result and error are kept.

The opt-in [Scrub Work Input worker](../../plugins/workers/worker-scrub-work-input.md) runs it every hour, by default for `EMAIL` and `MESSAGE` work finished more than a day ago:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { createScrubWorkInputPlugin } from '@unchainedshop/plugins/worker/scrub-work-input';

pluginRegistry.register(createScrubWorkInputPlugin({ maxAgeInSeconds: 24 * 60 * 60 }));
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `WORK_ADDED` | work item | Emitted when work is added to the queue |
| `WORK_ALLOCATED` | work item | Emitted when work is allocated to a worker |
| `WORK_FINISHED` | work item | Emitted when work finishes (success or failure) |
| `WORK_DELETED` | work item | Emitted when work is deleted |
| `WORK_RESCHEDULED` | `{ work, oldScheduled }` | Emitted when work is rescheduled |

Payloads are copies of the work item with the blacklisted variables obfuscated (see above).

## More Information

For API usage and detailed documentation, see the [core-worker package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-worker).
