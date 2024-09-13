# Unchained Engine

Licensed under the EUPL 1.2

[![CLA assistant](https://cla-assistant.io/readme/badge/unchainedshop/unchained)](https://cla-assistant.io/unchainedshop/unchained)

### **📖 [View Documentation](https://docs.unchained.shop)**

## Code of conduct

See our [Contributor Covenant Code of Conduct](/code_of_conduct.md) to view our pledge, standards,
responsibilites & more.

## Contributing

Please see our [Contribution Guidelines](/contributing.md).

## Quickstart

### Prerequisites

- Node.js 16 (see [.nvmrc](.nvmrc))

### Run the example

```bash
git clone https://github.com/unchainedshop/unchained.git
npm install
npm run build
cd examples/kitchensink
npm run build
npm start
```

1. Navigate to http://localhost:4000/ to view the welcome screen. You can login with: user:
   admin@unchained.local / password: password

2. Navigate to http://localhost:4010/graphql to view the GraphQL Playground

## Migration to Unchained 1.0

See [changelog.md](changelog.md)

## Migration to Unchained 2.0

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
