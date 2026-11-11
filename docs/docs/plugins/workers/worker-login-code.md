---
sidebar_position: 53
title: Login Code Worker
sidebar_label: Login Code
description: Mail login links with a one-time code
---

# Login Code Worker

Works off `requestLoginCode`: it looks up the user of the address in `input.email` and creates a login code challenge, whose `USER_ACCOUNT_ACTION` event queues the `ACCOUNT_ACTION` mail `login-code`. The result `{ sent }` is `false` for an unknown address, a deleted user, an unverified address of an account with a password or passkey, or an exhausted request limit. See [Login Codes](../../concepts/login-codes.md).

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { LoginCodePlugin } from '@unchainedshop/plugins/worker/login-code';

pluginRegistry.register(LoginCodePlugin);
```

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.login-code` |
| Type | `LOGIN_CODE` |
| Retries | 0 |
| Source | [worker/login-code](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/login-code) |
