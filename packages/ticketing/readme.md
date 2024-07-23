# Unchained Ticketing Extension

## Setup Example

boot.js:
```js
import { modules, setupTicketing } from "@unchainedshop/ticketing";

...
  const app = express();

  const httpServer = http.createServer(app);

  const engine = await startPlatform({
    modules,
    options: {},
  });

  connectPlatformToExpress4(app, engine, { corsOrigins: [] });

  // Unchained Ticketing Extension
  setupTicketing(app, engine.unchainedAPI as TicketingAPI, {
    renderOrderPDF,
    createAppleWalletPass,
    createGoogleWalletPass,
  });
...
```


renderOrderPDF.ts:
```tsx
import React from "react";
import ReactPDF, { Document } from "@react-pdf/renderer";

const TicketTemplate = ({ tickets }: { tickets: Array<any> }) => {
  return (
    <Document>
      Hello World
    </Document>
  );
};

export default async (
  { orderId, variant }: { orderId: string },
  { modules },
) => {
  const order = await modules.orders.findOrder({ orderId });
  ...
  const pdfStream = await ReactPDF.renderToStream(
    <TicketTemplate tickets={tickets} />,
  );
  return pdfStream;
};
```

createAppleWalletPass.ts:
```ts
import { UnchainedCore } from "@unchainedshop/types/core.js";
import { Template, constants } from "@walletpass/pass-js";

export default async (token, unchainedAPI: UnchainedCore) => {
  const template = new Template(
    "eventTicket",
    ...
  );
  const pass = await template.createPass(...);
  return pass;
};
```

createGoogleWalletPass.ts:
```ts
import { UnchainedCore } from "@unchainedshop/types/core.js";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

export default async (token, unchainedAPI: UnchainedCore) => {
  
  const product = ...;

  // upsert class

  // upsert object

  const asURL = async () =>
    createJwtNewObjects(issuerId, product._id, token.chainTokenId);

  return { asURL };
};
```

## Magic Key Order Access

Sometimes it's handy for users to allow them to access their orders and their tickets without actually logging in. For this you can generate a "magic key" that allows access to a single order and it's tickets via a request http header called `x-magic-key`.

For example: To retrieve the magic-key when sending an order-confirmation e-mail, just call `await modules.passes.buildMagicKey(orderId);` and append it to an URL like https://my-shop/:orderId?otp=:magicKey and then in the storefront, use the magic key and send it along via x-magic-key http header when using queries that are guarded by the actions `viewOrder`, `updateToken` and `viewToken`