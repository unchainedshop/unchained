---
title: Get started with the Unchained Engine
sidebar_title: Start the engine
---

> This tutorial walks you through installing and configuring a new [Meteor](https://www.meteor.com/) app with the server-side only Unchained Engine included.
> To test the Unchained Engine we setup the test frontend project _Storefront_ created with [React.js](https://reactjs.org/) and [Next.js](https://nextjs.org/) locally.
> An advanced understanding of [Node.js](https://nodejs.org) and [graphQL](https://graphql.org/) is required to follow this tutorial

This tutorial helps you:

- Obtain a basic understanding of the architecture
- Bootstrap a basic unchained backed project
- Write a pricing plugin
- Deploy an Unchained Engine backed the project

This tutorial assumes that you are familiar with the command line and
JavaScript.

# Create a new Unchained Engine

In this section, we will walk you through the steps required to start up an Unchained Engine api server locally. To perform your first shopping task, we setup the test webapp _Storefront_ and connect it to our Unchained Engine.

## Step 1: Install and run the Unchained Engine

1.  Initialize a new Unchained Engine with `npm` (or another package manager such as Yarn):

```bash
mkdir my-unchained-engine-meteor-app
cd my-unchained-engine-meteor-app

npm init @unchainedshop engine

npm run install
```

Your project directory now contains a Meteor project with Unchained as a dependency

2. Start the engine

```bash
meteor npm start
```

3. Open [localhost:4010](http://localhost:4010) to check your server api is running correctly. If you see the following admin app your set.
[localhost:4010/graphql](http://localhost:4010/graphql) opens the graphQL playground for you to easily execute queries and mutations. 

## Step 2: Install and setup the frontend shop _Storefront_

The _Storefront_ project is a Next.js based web app using the React library and connects to your Unchained Engine through graphQL queries.

1.  Initialize a new Unchained Engine with `npm` (or another package manager such as Yarn):

```bash
mkdir my-storefront-webapp
cd my-storefront-webapp

npm init @unchainedshop storefront

npm run install
```

Your project directory now contains a Next.js project that connects per

2. Start the engine

```bash
meteor npm start
```

3. Open [localhost:4010/graphql](http://localhost:4010/graphql) to check your server api is running correctly
 

before you can run the instance locally there are few environment variables you need to set for each service.

create a `.env` file under the root directory of both `engine` and `storefront` then add the following value accordingly.

For the engine environment even though there are many environment variables you can set which we will describe later, the following is the required one.

```
SUPPRESS_ENV_ERRORS=false
```

Next under the root directory of storefront create a `.env` file and add the following environment variable.

```
UNCHAINED_ENDPOINT=https://localhost:4010/graphql
```

Not you can customize the above value once you get accustomed to the inner working of unchained. 

Finally, the only thing remaining is firing up unchained sees its work in action. to do so go to the projects root directory and run

```
npm run dev
```

Now you have a fully running Unchained E-Commerce environment running locally. Check it out by browsing to the following URLs:

- http://localhost:3000 to see the front-end (storefront)
- http://localhost:4010 to see the control panel. Login with username: admin@unchained.local / password: password
- http://localhost:4010/graphql to see the Unchained GraphQL Playground


# Create a new Unchained Engine


## Step 2: Write a custom pricing plugin

Next, we will add a new file to the project and name it `engine/sausage.js`:

```js
import {
    ProductPricingDirector,
    ProductPricingAdapter
  } from "meteor/unchained:core-pricing";
  import fetch from "isomorphic-unfetch";
  
  const PRODUCT_TAG_SAUSAGE = "sausage";
  const SAUSAGE_THRESHOLD_CELSIUS = 20;
  
  class WeatherDependentBarbequeSausagePricing extends ProductPricingAdapter {
    static key = "shop.unchained.wd-bbq-sausage-pricing";
    static version = "1.0";
    static label = "Calculate the price of a sausage 🌭🌦";
    static orderIndex = 3;
  
    static isActivatedFor({product}) {
      if (
        product.tags &&
        product.tags.length > 0 &&
        product.tags.indexOf(PRODUCT_TAG_SAUSAGE) !== -1
      ) {
        return true;
      }
      return false;
    }
  
    async calculate() {
      const { currency, quantity } = this.context;
      try {
        const response = await fetch(
          "https://community-open-weather-map.p.rapidapi.com/weather?q=zurich,ch&units=metric", 
          {
            headers: {
              "x-rapidapi-key": "2a849e288dmsh59370f28a9102f6p1c881cjsn28010ce8ff58",
              "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
              "useQueryString": true
            }
          }
        );
        if (response.status === 200) {
          const { main } = await response.json();
          const { temp} = main;
          if (temp) {
            if (temp > SAUSAGE_THRESHOLD_CELSIUS) {
              console.log("🌭 -> High season, sausage pricy!!"); // eslint-disable-line
              this.result.addItem({
                currency,
                amount: 100 * quantity,
                isTaxable: true,
                isNetPrice: true,
                meta: { adapter: this.constructor.key }
              });
            }
          }
        }
      } catch (e) {
        console.error(`🌭 -> Failed while trying to price weather dependent ${e.message}`); // eslint-disable-line
      }
  
      return super.calculate();
    }
  }
  
  ProductPricingDirector.registerAdapter(WeatherDependentBarbequeSausagePricing);
```

When you read through the code you can anticipate the domain logic: All products that have the tag "sausage" will get 1 CHF more expensive when a certain temperature threshold has been reached at a specific location.

Now let's load that plugin in `engine/boot.js`

```
import "./sausage";
```
# Build the Storefront
## Step 3: Create a new product

Now open the control panel and add a new product, tag it with "sausage", set a price, and publish it. As always you can use GraphQL mutations to do that:

```graphql
mutation {
  createProduct(
    product: { type: "SimpleProduct", title: "Cervelat", tags: "sausage" }
  ) {
    _id
  }
}
```

```graphql
mutation {
  updateProductCommerce(
    productId: "dKn2dvfqjiiJ6DbJA"
    commerce: {
      pricing: [{ currencyCode: "CHF", countryCode: "CH", amount: 200 }]
    }
  ) {
    ... on SimpleProduct {
      simulatedPrice {
        price {
          amount
        }
      }
    }
  }
  publishProduct(productId: "dKn2dvfqjiiJ6DbJA") {
    status
  }
}
```

The `simulatedPrice` is now being affected by the pricing plugin, try it by changing the temperature threshold variable in `sausage.js`

## Step 4: Test Cart Checkout

Use the following GraphQL queries/mutations to do your first checkout.

You can browse to http://localhost:4010/graphql to bring up the GraphQL Playground.

To initiate a cart/basket, you need to be logged in. You can log in as a guest with a simple call:

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

Set order payment provider (optional):

```
mutation SetOrderPaymentProvider{
    setOrderPaymentProvider(
      orderId: "ORDERID",
      paymentProviderId: "PROVIDER_ID"
    )
  }
```

Set order delivery provider (optional):

```
mutation SetOrderDeliverProvider {
    setOrderDeliveryProvider(
      orderId: "ORDERID",
      deliveryProviderId: "PROVIDER_ID"
    )
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

If everything went well, the e-mail debugs window will pop up presenting you with a simple order confirmation.


The exact configuration will differ from this template, as we encourage you to use a reverse proxy like traefik or Nginx for SSL termination and a replicated MongoDB with one daemon running in the same datacenter like an Unchained Engine (low latency).

for more mutation and query options available refere to the [GraphQL API Reference](https://docs.unchained.shop/api)

