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

You can provide a custom list of blacklisted variables, keys which are part of the blacklist will be obfuscated with `*****` in Work Queue APIs and when publishing Events.

Example custom configuration:

```typescript
const options = {
  modules: {
    worker: {
      blacklistedVariables: ['secret-key'],
    },
  },
};
```

By default, those variables are filtered: [buildObfuscatedFieldsFilter](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/build-obfuscated-fields-filter.ts)

## Events

The worker module does not emit events directly. Work items are processed by registered worker plugins which may emit their own events.

## More Information

For API usage and detailed documentation, see the [core-worker package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-worker).
