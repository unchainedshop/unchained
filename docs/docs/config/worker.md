---
sidebar_position: 11
sidebar_label: Worker
title: Worker
---
:::
Configure the Worker Module
:::


- blacklistedVariables: `Array<string>` provide a custom list of blacklisted variables, keys which are part of the blacklist will be obfuscated with `*****` in Work Queue API's and when publishing Events.

Example custom configuration:

```
const options = {
  modules: {
    worker: {
      blacklistedVariables: ['secret-key']
    },
  }
};
```

By default those variables are filtered:
- `password`,
- `newPassword`,
- `oldPassword`,
- `authorization`,
- `secret`,
- `accesskey`,
- `accesstoken`,
- `token`