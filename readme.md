# Unchained Engine

Licensed under the EUPL 1.2

[![CLA assistant](https://cla-assistant.io/readme/badge/unchainedshop/unchained)](https://cla-assistant.io/unchainedshop/unchained)

## Quickstart

### Prerequisites

- Meteor 1.8.1
- Node.js 8.16.0 (lts/carbon, see [.nvmrc](.nvmrc))

### Run the example

```bash
git clone https://github.com/unchainedshop/unchained.git
npm install
npm run dev
```

- Navigate to http://localhost:4000/ to view the controlpanel. You can login with: user: admin@localhost / password: password
- Navigate to http://localhost:4010/graphql to view the GraphQL Playground

### Start your own Project

1. Install Meteor from meteor.com

2. Download the latest version of unchained from https://github.com/unchainedshop/unchained/releases, just download the latest zip file of the source code.

3. Create an empty folder for your own project

4. Copy the contents of 'examples/minimal' to the project root

5. Run your project:

```
meteor npm install
meteor npm run dev
```

6. (Optionally) Add the controlpanel (see section below)



If you have issues installing or running meteor in your environment or you don't want to install the meteor cli on your computer, try it that way to ramp up a dev environment:

```
docker build -f Dockerfile.dev -t unchained-local-dev .
docker run -it -p 4010:4010 -p 4011:4011 --mount type=bind,source="$(pwd)",target=/app unchained-local-dev
```

## Add the control panel




## Configuration

### Platform

To start the server inside a meteor project, use:
```
import { startPlatform } from 'meteor/unchained:platform';
Meteor.startup(() => {
  startPlatform(options);
});
```

These options are available:

- corsOrigins: Array/Function (Determine if origin is fine for CORS)
- rolesOptions: Object (Roles configuration)
- engine: String (Apollo Engine Key)
- introspection: Boolean (Enable/Disable introspection)
- playground: Boolean (Enable/Disable playground)
- mergeUserCartsOnLogin: Boolean (Enable/Disable merge mode of carts when user gets logged in)

### Settings API

E.g. given these settings:

```
// meteor-settings.json
{
  "unchained": {
    "files": {
      "media": {
         "maxSize": 10485760
      }
    }
  }
}
```

you can access `maxSize` with this:

```
import { getSetting } from 'meteor/unchained:core-settings';

const maxSize = getSetting('files.media.maxSize')

// it uses lodash.get, so you can pass a path as an array
const maxSize = getSetting(["files", "media", "maxSize"])

// and you can specify a default value

const maxSize = getSetting("files.avatars.maxSize", 10485760);
```

### configure FileCollections

to set gridfs for all collections, use this:

```
{
  "unchained": {
    "files": {
      "default": {
        "storage": {
          "type": "gridfs"
        }
      }
    }
  }
}
```

all collections will use `default`, unless specified directly:

```
{
  "unchained": {
    "files": {
      "media": {
        "maxSize": 10485760
      }
    }
  }
}
```

### Cart API

How order positions get generated out of quotations and configurable products:

- addCartProduct of a ConfigurableProduct resolves to the concrete product if enough variation vector parameters provided through product configuration parameters. The source productId is saved into context.origin, the variation configuration is stored on the item along other product configuration parameters

- addCartQuotation resolved to the actual product and adds that to the cart. It uses a transform method of the quotation plugin system to transform a quotationConfiguration to a productConfiguration. The source quotationId is saved into context.origin

It's also possible to chain:

addCartQuotation is called with quotation Y
-> resolves to a Matrix product X with a specific configuration
-> specific configuration is handed to vector logic trying to find a distinct concrete product Z
-> bundle product Z is resolved

Now the cart looks like this:

1 x Bundle Z


### Configure Slugs

You can override the default slugify function for certain core modules like that:

```
import { ProductTexts } from 'meteor/unchained:core-products';
const oldMakeSlug = ProductTexts.makeSlug;
ProductTexts.makeSlug = rest =>
  oldMakeSlug(rest, {
    slugify: (title) => {
      return 'fu';
    }
  });
```

Currently ProductTexts from core-products and AssortmentTexts from core-assortments are supported.

### Integrate Control Panel in Unchained Project

1. Add @unchainedshop/controlpanel as dependency (`meteor npm install @unchainedshop/controlpanel`)

2. Use the embedControlpanelInMeteorWebApp function after startPlatform

```
import { WebApp } from 'meteor/webapp';
import { embedControlpanelInMeteorWebApp } from '@unchainedshop/controlpanel';

Meteor.startup(() => {
  embedControlpanelInMeteorWebApp(WebApp);
});
```

## Simple Checkout

```
mutation loginAsGuest {
  loginAsGuest {
    id
    token
    tokenExpires
  }
}
```

Then set the authorization header in GraphiQL
```
{
  "Authorization": "Bearer HERE_GOES_THE_TOKEN_FROM_ABOVE"
}
```

```
query products {
  products {
    _id
    texts {
      title
    }
    ... on SimpleProduct {
      simulatedPrice(quantity: 2) {
        price {
          amount
        }
      }
    }
  }
}
```

```
mutation addCartProduct {
  addCartProduct(productId: "A9e2kCJfcF9QZF4o9", quantity: 1) {
    _id
    order {
      items {
        _id
        quantity
      }
    }
  }
}
```

```
mutation updateContact {
  updateCart(contact: { emailAddress: "hello@localhost" }, billingAddress: {firstName: "Pascal", addressLine: "Haha", postalCode: "5556", city: "somewhere"}) {
    _id
  }
}
```

```
mutation checkoutCart {
  checkoutCart {
    _id
    orderNumber
    ordered
    confirmed
  }
}
```
