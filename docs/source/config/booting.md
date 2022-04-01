---
title: 'Boot up'
description: Start the Unchained Engine
---

# Platform Configuration

Setting up the Unchained Engine is simple:

Add unchained:platform to your meteor project, copy the dependencies part of the minimal example to your own project's package.json, then start the engine:

```
import { Meteor } from 'meteor/meteor';
import { startPlatform } from 'meteor/unchained:platform';

Meteor.startup(async () => {
  const unchainedApi = await startPlatform();
  await unchainedApi.modules.accounts.createUser(
    {
      email: 'admin@unchained.local',
      guest: false,
      initialPassword: 'true',
      lastBillingAddress: {},
      password: hashPassword('admin'),
      profile: { address: {} },
      roles: ['admin'],
      username: 'admin',
    },
    { skipMessaging: true },
  );
});
```

These options are available:

- corsOrigins: Array/Boolean (Determine if origin is fine for cors, set to true to reflect all origins in http responses)
- rolesOptions: Object (Roles configuration)
- mergeUserCartsOnLogin: Boolean (Enable/Disable merge mode of carts when user gets logged in)
- assignCartForUsers: boolean (Enable/Disable assigning carts for existing users on startup, default: `false`)
- invalidateProviders: boolean (Enable/Disable invalidating carts on startup, default: `true`)
- typeDefs: Object (GraphQL Schema that gets merged with the default schema)
- resolvers: Object (GraphQL Resolvers that get merged with the default API)
- modules: Core Module specific configuration (see next pages)

Other options are forwarded to the Apollo Engine, the available options are documented here: https://www.apollographql.com/docs/apollo-server

# Enable Controlpanel

1. Add @unchainedshop/controlpanel as dependency (`npm install @unchainedshop/controlpanel`)

2. Use the embedControlpanelInMeteorWebApp function after startPlatform

```
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

Meteor.startup(() => {
  embedControlpanelInMeteorWebApp(WebApp);
});
```
