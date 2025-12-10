# Migration Guide v1 -> v2

1. WHATWG Fetch Support required
Update Node to 18 or enable Experimental Fetch support on Node.js 16+

2. GraphQL Version & Express backed-in
```
npm install graphql@16
npm uninstall apollo-server-express body-parser graphql-scalars graphql-upload isomorphic-unfetch locale simpl-schema
```

3. Switch to Battery-Included

Remove custom login-with-single-sign-on and remove all code that involves loading standard plugins and/or gridfs/datatrans webhooks. Furthermore `startPlatform` will not hook into express and it will not start the graphql server automatically anymore. This has been changed to support other backend frameworks than Express and to support Lambda Mode of Apollo. For those reasons, `startPlatform` has been changed and now returns an object containing `unchainedAPI` and the `apolloGraphQLServer`.

To make it boot with express and the default plugins, you have to do the following:

Import the connect functions and the defaultModules:

```
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { connect } from '@unchainedshop/api/express/index.js';
```

Then pass defaultModules to the „modules“ prop of startPlatform:

```
const engine = await startPlatform({ modules: defaultModules, … });
```

Now, start the GraphQL server, connect it to Express and load the custom modules:

```
const engine = await startPlatform({ … });

await engine.apolloGraphQLServer.start(); // Counterintuitively, this has to be done before the platform is connected to express
  
connect(app, engine);
connectDefaultPluginsToExpress4(app, engine);
```

5. The userId’s that were used to set some internal db fields about updatedBy / createdBy need to be dropped from various functions. This will most propably affect seed code. Typescript will help you with that.

6. Examine the API Breaking Changes in the Changelog for API incompatibilities between 1.2 and 2.0.
