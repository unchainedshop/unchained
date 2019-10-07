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
meteor npm install
meteor npm run dev
```

1. Navigate to http://localhost:4000/ to view the controlpanel. You can login with: user: admin@localhost / password: password

2. Navigate to http://localhost:4010/graphql to view the GraphQL Playground

### Or start your own Project

1. Download the latest version of unchained from https://github.com/unchainedshop/unchained/releases, just download the latest zip file of the source code.

2. Create an empty folder for your own project

3. Copy the contents of 'examples/minimal' to the project root

4. Run your project:

```
meteor npm install
meteor npm run dev
```

5. (Optionally) Add the controlpanel (see section below)



If you have issues installing or running meteor in your environment or you don't want to install the meteor cli on your computer, try it that way to ramp up a dev environment:

```
docker build -f Dockerfile.dev -t unchained-local-dev .
docker run -it -p 4010:4010 -p 4011:4011 --mount type=bind,source="$(pwd)",target=/app unchained-local-dev
```

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

### Simple Checkout

Use the following GraphQL queries/mutations to do your first checkout.

You can browse to http://localhost:4010/graphql to bring up the GraphQL Playground.

To initiate a cart/basket, you need to be logged in. You can login as guest with a simple call:

```
mutation loginAsGuest {
  loginAsGuest {
    id
    token
    tokenExpires
  }
}
```

Then set the authorization header in GraphQL Playground for all upcoming operations:
```
{
  "Authorization": "Bearer HERE_GOES_THE_TOKEN_FROM_ABOVE"
}
```

Get the list of products:

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

Add the product that you've found to the cart.

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

Tell unchained more about the guy who orders:

```
mutation updateContact {
  updateCart(contact: { emailAddress: "hello@localhost" }, billingAddress: {firstName: "Pascal", addressLine: "Haha", postalCode: "5556", city: "somewhere"}) {
    _id
  }
}
```

Checkout the cart:

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

## Configuration

### Platform

Setting up unchained engine is simple:

Add unchained:platform to your meteor project, copy the dependencies part of the minimal example to your own project's package.json, then start the engine:

```
import { startPlatform } from 'meteor/unchained:platform';
Meteor.startup(() => {
  startPlatform(options);
});
```

These options are available:

- corsOrigins: Array/Boolean (Determine if origin is fine for cors, set to true to reflect all origins in http responses)
- rolesOptions: Object (Roles configuration)
- mergeUserCartsOnLogin: Boolean (Enable/Disable merge mode of carts when user gets logged in)
- typeDefs: Object (GraphQL Schema that gets merged with the default schema)
- resolvers: Object (GraphQL Resolvers that get merged with the default API)

All other options are forwarded to the Apollo Engine, the available options are documented here: https://www.apollographql.com/docs/apollo-server

### Package: Settings

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

### Package: Files

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

### Package: Orders

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


### Package: Products

**Configure Slugs**

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
