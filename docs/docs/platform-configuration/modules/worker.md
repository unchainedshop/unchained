---
sidebar_position: 10
sidebar_label: Worker
title: Worker Options
---

```typescript
export interface WorkerSettingsOptions {
  blacklistedVariables?: string[];
}
```

### Blacklisting Variables

Security Feature.

You can provide a custom list of blacklisted variables, keys which are part of the blacklist will be obfuscated with `*****` in Work Queue API's and when publishing Events.

Example custom configuration:

```typescript
const options = {
  modules: {
    worker: {
      blacklistedVariables: ['secret-key']
    },
  }
};
```

By default, those variables are filtered: [buildObfuscatedFieldsFilter](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/build-obfuscated-fields-filter.ts)