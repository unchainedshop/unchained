---
title: Get started with Unchained Engine
sidebar_title: Create a Project
---

> This tutorial walks you through installing and configuring Unchained Engine.
> If you're just getting started with GraphQL or Node.js this will be too hard to follow

This tutorial helps you:

- Obtain a basic understanding of the architecture
- Bootstrap a basic unchained backed project
- Write a pricing plugin
- Deploy an unchained engine backed project

This tutorial assumes that you are familiar with the command line and
JavaScript, and that you have a recent version of Meteor.js installed.

## Step 1: Create a new project

1.  Initialize a new Unchained project with `npm` (or another package manager you
    prefer, such as Yarn):

```bash
mkdir your-awesome-ecommerce-project
cd your-awesome-ecommerce-project

npm init @unchainedshop

npm run install-all
npm run dev
```

Now you have a fully running Unchained E-Commerce environment running locally. Check it out by browsing to the following URLs:

- http://localhost:3000 to see the front-end (storefront)
- http://localhost:4010 to see the control panel. Login with username: admin@localhost / password: password
- http://localhost:4010/graphql to see the Unchained GraphQL Playground

Your project directory now contains the following folders representing 3 services:

- **cms**: Contains a Dockerfile for a PHP based headless CMS [GetCockpit](https://getcockpit.com) )
- **engine**: Contains a boilerplate Meteor project with Unchained as dependency
- **storefront**: Contains a Next.js based Web App that connects to Unchained and GetCockpit


## Step 2: Write a custom pricing plugin

Next we will add a new file to the project and name it "engine/sausage.js":

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

  static isActivatedFor(product) {
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
        "https://query.yahooapis.com/v1/public/yql?q=select%20item.condition.temp%20from%20weather.forecast%20where%20woeid%20%3D%20784794&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"
      );
      if (response.status === 200) {
        const { query } = await response.json();
        const { results, count } = query;
        if (count > 0) {
          const { temp: tempFahrenheit } = results.channel.item.condition;
          const tempCelsius = (parseFloat(tempFahrenheit) - 32) / 1.8;
          if (tempCelsius > SAUSAGE_THRESHOLD_CELSIUS) {
            console.log("🌭 -> High season, sausage pricy!!"); // eslint-disable-line
            this.result.addItem({
              currency,
              amount: +100 * quantity,
              isTaxable: true,
              isNetPrice: true,
              meta: { adapter: this.constructor.key }
            });
          }
        }
      }
    } catch (e) {
      console.error("🌭 -> Failed while trying to price weather dependent"); // eslint-disable-line
    }

    return super.calculate();
  }
}

ProductPricingDirector.registerAdapter(WeatherDependentBarbequeSausagePricing);
```

When you read though the code you can anticipate the domain logic: All products that have the tag "sausage" will get 1 CHF more expensive when a certain temperatur treshold has been reached at a specific location.

Now let's load that plugin in engine/boot.js

```
import "./sausage";
```

## Step 3: Create a new product

Now open the controlpanel and add a new product, tag it with "sausage", set a price and publish it. As always you can use GraphQL mutations to do that:

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

The simulatedPrice is now beeing affected by the pricing plugin, try it by changing the temperature treshold variable in sausage.js

## Step 4: Test Cart Checkout

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

If everything went well, the e-mail debug window will pop up presenting you a simple order confirmation.

## Step 5: Deploy the stack with docker

To help you deploy your project to production, we provide you with an example docker-compose.yml that works with Docker Desktop. More infos about that process can be found here: https://docs.docker.com/docker-for-mac/kubernetes/

```bash
docker stack deploy -c docker-compose.yml my-project
```

The exact configuration will differ from this template, as we encourage you to use a reverse proxy like traefik or nginx for SSL termination and a replicated MongoDB with one daemon running in the same datacenter like unchained engine (low latency).

## Next steps

Get to know the concepts

- [Carts](concepts/carts)
