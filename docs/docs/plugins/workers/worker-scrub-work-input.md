---
sidebar_position: 54
title: Scrub Work Input Worker
sidebar_label: Scrub Work Input
description: Remove the personal data in the input of sent mails and messages
---

# Scrub Work Input Worker

Removes the input of finished work before the work queue deletes the work. Work is kept for 30 days (see [Retention](../../platform-configuration/modules/worker.md#retention)), and the input of `EMAIL` and `MESSAGE` work holds recipient addresses, mail texts and links, account links with their tokens included. Once the work finished or was deleted, it does not run again and no longer needs that input.

The worker calls `modules.worker.scrubWorkInput`: the input of matching work is replaced with only its kept keys, and `scrubbed` is set on the work. Status, result, error and dates stay as they are, so the result of `EMAIL` work (the Nodemailer info, with the accepted recipient addresses) is kept until the work expires.

## Registration

Opt-in and not part of any preset. Register the plugin in your boot code, before `startPlatform()`:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ScrubWorkInputPlugin } from '@unchainedshop/plugins/worker/scrub-work-input';

pluginRegistry.register(ScrubWorkInputPlugin);
```

To change the defaults, create the plugin with options instead:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import {
  createScrubWorkInputPlugin,
  defaultScrubbedWorkTypes,
} from '@unchainedshop/plugins/worker/scrub-work-input';

pluginRegistry.register(
  createScrubWorkInputPlugin({
    types: [...defaultScrubbedWorkTypes, 'TWILIO'],
    maxAgeInSeconds: 6 * 60 * 60,
    schedule: '*/15 * * * *',
  }),
);
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `types` | `string[]` | `defaultScrubbedWorkTypes` (`EMAIL`, `MESSAGE`) | Work types whose input is scrubbed |
| `maxAgeInSeconds` | Number | `86400` (one day) | Work that finished or was deleted longer ago is scrubbed |
| `keep` | `string[]` | `['template']` | Input keys that are kept. The template name of `MESSAGE` work tells which message was sent, and the Admin UI lists messages by it |
| `schedule` | String | `'0 * * * *'` (every hour) | Cron expression (5 fields, server time) of the runs |

The options other than `schedule` become the input of the scheduled work.

:::warning Retries
Failed work with retries left is retried with a copy of its input, made right when it fails. Keep `maxAgeInSeconds` well above zero so a scrub never runs before that copy is made, and so you have time to look into a failed mail.
:::

## Auto-Scheduling

Runs automatically every hour (cron `0 * * * *`, retries 0), configured on registration.

## Usage

Trigger a run manually:

```graphql
mutation ScrubWorkInput {
  addWork(
    type: SCRUB_WORK_INPUT
    input: { types: ["EMAIL", "MESSAGE"], maxAgeInSeconds: 3600 }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `types` | `string[]` | `EMAIL`, `MESSAGE` | Work types whose input is scrubbed |
| `maxAgeInSeconds` | Number | `86400` | Work that finished or was deleted longer ago is scrubbed |
| `keep` | `string[]` | `['template']` | Input keys that are kept |

An invalid input fails the work with `INVALID_INPUT`.

## Result

```json
{
  "scrubbedCount": 0
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.scrub-work-input` |
| Type | `SCRUB_WORK_INPUT` |
| Auto-Schedule | Every hour |
| Retries | 0 |
| Source | [worker/scrub-work-input](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/scrub-work-input) |

## Related

- [Worker Module](../../platform-configuration/modules/worker.md) — retention and obfuscation of work
- [Email Worker](./worker-email.md)
- [Message Worker](./worker-message.md)
