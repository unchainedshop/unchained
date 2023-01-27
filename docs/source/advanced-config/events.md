---
title: 'Events'
description: Configure the Events Module
---

Unchained supports the publish-subscribe (pub/sub) event model to keep track of events emitted in each module. By default it uses nodejs EventEmitter module to handle events but can easily be extended to use any event tracker module by extending the `EventAdapter` class which we will briefly see later.

The `@unchainedshop/core-events` module exports three utility functions that can be used to interact with the registered event tracker, or register new custom events.

- `registerEvents`: adds custom events that will be tracked. it takes array of event names.
- `emit(eventName, payload)`: used to emit events, either pre-built events or custom events registered using `registerEvents`. It takes two arguments, name of the event we want to emit and an object of the data associated with the event.
- `subscribe(eventName: callback)`: used for subscribing to events emitted by `emit` function. It takes two arguments, name of the event we want to subscribe to and a call back that will take one argument holding data for the associated event.

Note: to get list of pre-built or custom events registered on unchained use `EventType` resolver inside GraphQL playground.

Every event emitted from the engine is an object that has one property `payload` which is also an object that has different properties based on the event. We recommend you follow the same pattern when implementing custom events.

## Built-in Events

Below are events tracked under each module under the box:

#### `core-assortments`:

| Event name                   | Emited when...                           | `payload`                                                   |
| :--------------------------- | :--------------------------------------- | :---------------------------------------------------------- |
| ASSORTMENT_CREATE            | Assortment is created                    | `{ assortment: {} }`                                        |
| ASSORTMENT_ADD_FILTER        | Assortment filter is created             | `{ assortmentFilter: {} }`                                  |
| ASSORTMENT_ADD_LINK          | Assortment link is created               | `{ parentAssortmentId: string, childAssortmentId: string }` |
| ASSORTMENT_ADD_PRODUCT       | Product is added to an assortment        | `{ assortmentProduct: {} }`                                 |
| ASSORTMENT_REMOVE            | Assortment is deleted                    | `{ assortmentId: string }`                                  |
| ASSORTMENT_REMOVE_FILTER     | Assortment filter is deleted             | `{ assortmentFilterId: string }`                            |
| ASSORTMENT_REMOVE_LINK       | Assortment link is removed               | `{ assortmentLinkId: string }`                              |
| ASSORTMENT_REORDER_PRODUCTS  | Assortment product sort order is updated | `{ assortmentProducts: [] }`                                |
| ASSORTMENT_REORDER_FILTERS   | Assortment filters sort order is updated | `{ assortmentFilters: [] }`                                 |
| ASSORTMENT_REORDER_LINKS     | Assortment link is updated               | `{ assortmentLinks: [] }`                                   |
| ASSORTMENT_SET_BASE          | Assortment is set as base assortment     | `{ assortmentId: string }`                                  |
| ASSORTMENT_UPDATE            | Assortment is updated                    | `{ assortmentId: string }`                                  |
| ASSORTMENT_UPDATE_TEXTS      | Assortment text is updated               | `{ assortmentId: string, assortmentTexts: [] }`             |
| ASSORTMENT_ADD_MEDIA         | Media is added for a product             | `{ assortmentMedia: {} }`                                   |
| ASSORTMENT_REMOVE_MEDIA      | Media is deleted from a product          | `{ assortmentMediaId: string }`                             |
| ASSORTMENT_UPDATE_MEDIA_TEXT | Product media text is updated            | `{assortmentMedia: {}, mediaTexts: {} }`                    |

#### `core-products`

| Event name                      | Emited when...                                               | `payload`                                                                 |
| :------------------------------ | :----------------------------------------------------------- | :------------------------------------------------------------------------ |
| PRODUCT_ADD_ASSIGNMENT          | CONFIGURABLE_PRODUCT type is assigned proxy product          | `{ productId: string, proxyId: string }`                                  |
| PRODUCT_ADD_MEDIA               | Media is added for a product                                 | `{ productMedia: {} }`                                                    |
| PRODUCT_REVIEW_ADD_VOTE         | Product review is recieves a vote                            | `{ productReview: {} }`                                                   |
| PRODUCT_CREATE                  | Product is created                                           | `{ product: {} }`                                                         |
| PRODUCT_CREATE_BUNDLE_ITEM      | BUNDLE_PRODUCT is assigned bundle items                      | `{ productId: string }`                                                   |
| PRODUCT_REVIEW_CREATE           | Product review is created                                    | `{ productReview : {} }`                                                  |
| PRODUCT_CREATE_VARIATION        | Product variation is created                                 | `{ productVariation: {} }`                                                |
| PRODUCT_VARIATION_OPTION_CREATE | Product variation option is created                          | `{ productVariation: {} }`                                                |
| PRODUCT_REMOVE_BUNDLE_ITEM      | Bundle item is removed from a BUNDLE_PRODUCT type            | `{ productId: string, item: {} }`                                         |
| PRODUCT_REMOVE                  | Product is deleted                                           | `{ productId: string }`                                                   |
| PRODUCT_REMOVE_ASSIGNMENT       | Proxy assignment is removed from a CONFIGURABLE_PRODUCT type | `{ productId: string }`                                                   |
| PRODUCT_REMOVE_MEDIA            | Media is deleted from a product                              | `{ productMediaId: string }`                                              |
| PRODUCT_REMOVE_REVIEW           | Product review is deleted                                    | `{ productReviewId: string }`                                             |
| PRODUCT_REMOVE_REVIEW_VOTE      | Product review vote is removed                               | `{ productReviewId: string, type: string, userId: string }`               |
| PRODUCT_REMOVE_VARIATION        | Product variation is removed from a product                  | `{ productVariationId: string }`                                          |
| PRODUCT_REMOVE_VARIATION_OPTION | Product variation option is removed                          | `{ productVariationId: string, productVariationOptionValue: {} }`         |
| PRODUCT_REORDER_MEDIA           | Product media sort order is updated                          | `{ productMedias: [] }`                                                   |
| PRODUCT_UNPUBLISH               | Product is unpublished                                       | `{ product: {} }`                                                         |
| PRODUCT_PUBLISH                 | product is published                                         | `{ product: {} }`                                                         |
| PRODUCT_UPDATE                  | product is updated                                           | `{ productId: string, type: string, [commerce,support,warehousing]: {} }` |
| PRODUCT_UPDATE_MEDIA_TEXT       | Product media text is updated                                | `{productMedia: {}, mediaTexts: {} }`                                     |
| PRODUCT_UPDATE_REVIEW           | Product review is updated                                    | `{ productReview: {} }`                                                   |
| PRODUCT_UPDATE_TEXTS            | Product text is updated                                      | `{ product: {}, productTexts: [] }`                                       |
| PRODUCT_UPDATE_VARIATION_TEXTS  | product variation text is updated                            | `{ productVariation: {}, productVariationTexts: [] }`                     |

#### `core-orders`

| Event name                  | Emitted when...                                | `payload`                                      |
| :-------------------------- | :--------------------------------------------- | :--------------------------------------------- |
| ORDER_UPDATE_DELIVERY       | Order delivery information is updated          | `{ orderDelivery: {} }`                        |
| ORDER_SIGN_PAYMENT          | Order payment provider is signed               | `{ orderPayment: {}, transactionContext: {} }` |
| ORDER_REMOVE                | Order is deleted                               | `{ orderId: string }`                          |
| ORDER_ADD_PRODUCT           | Product is added to an order                   | `{ orderPosition : {} }`                       |
| ORDER_ADD_DISCOUNT          | Discount is added to an order                  | `{ discount: {} }`                             |
| ORDER_CONFIRMED             | Order is confirmed                             | `{ order: {} }`                                |
| ORDER_FULLFILLED            | All requested items are fullfiled for an order | `{ order: {} }`                                |
| ORDER_UPDATE_PAYMENT        | Order payment provider is updated              | `{ orderPayment: {} }`                         |
| ORDER_CREATE                | New Order is created                           | `{ order: {} }`                                |
| ORDER_UPDATE                | Order information is updated                   | `{ order: {}, field: string }`                 |
| ORDER_SET_PAYMENT_PROVIDER  | Payment provider is assigned for an order      | `{ order: {}, paymentProviderId: string }`     |
| ORDER_SET_DELIVERY_PROVIDER | Delivery provider is assigned to an order      | `{ order: {}, deliveryProviderId: string }`    |
| ORDER_EMPTY_CART            | All cart items are removed from an order       | `{ orderId: string, count: number }`           |
| ORDER_UPDATE_CART_ITEM      | Items in Order are updated, eg quantity        | `{ orderPosition: {} }`                        |
| ORDER_REMOVE_CART_ITEM      | Items are delted from an order                 | `{ orderPosition: {} }`                        |
| ORDER_UPDATE_DISCOUNT       | Order discount is updated                      | `{ discount: {} }`                             |
| ORDER_REMOVE_DISCOUNT       | Discount associated with Order is removed      | `{ discount: {} }`                             |
| ORDER_CHECKOUT              | Order is checked out successfuly               | `{ order: {} }`                                |
| ORDER_PAY                   | Order payment is complete                      | `{ orderPayment: {} }`                         |
| ORDER_DELIVERY              | Order delivery status is changed to deliverd   | `{ orderDelivery: {} }`                        |

#### `core-bookmarks`

| Event name      | Emitted when...         | `payload`                |
| :-------------- | :---------------------- | :----------------------- |
| BOOKMARK_CREATE | New bookmark is created | `{ bookmarkId: string }` |
| BOOKMARK_REMOVE | Bookmark is removed     | `{ bookmarkId: string }` |

#### `core-country`

| Event name     | Emitted when...        | `payload`               |
| :------------- | :--------------------- | :---------------------- |
| COUNTRY_CREATE | New country is created | `{ country: {} }`       |
| COUNTRY_UPDATE | Country is update      | `{ countryId: string }` |
| COUNTRY_REMOVE | Country is removed     | `{ countryId: string }` |

#### `core-currency`

| Event name      | Emitted when...         | `payload`                |
| :-------------- | :---------------------- | :----------------------- |
| CURRENCY_CREATE | New currency is created | `{ currency: {} }`       |
| CURRENCY_UPDATE | Currency is update      | `{ currencyId: string }` |
| CURRENCY_REMOVE | Currency is removed     | `{ currencyId: string }` |

#### `core-language`

| Event name      | Emitted when...         | `payload`                |
| :-------------- | :---------------------- | :----------------------- |
| LANGUAGE_CREATE | New language is created | `{ language: {} }`       |
| LANGUAGE_UPDATE | Language is update      | `{ languageId: string }` |
| LANGUAGE_REMOVE | Language is removed     | `{ languageId: string }` |

#### `core-filter`

| Event name    | Emitted when...       | `payload`              |
| :------------ | :-------------------- | :--------------------- |
| FILTER_CREATE | New filter is created | `{ filter: {} }`       |
| FILTER_UPDATE | Filter is update      | `{ filter: {} }`       |
| FILTER_REMOVE | Filter is removed     | `{ filterId: string }` |

#### `core-payment`

| Event name              | Emitted when...                 | `payload`                 |
| :---------------------- | :------------------------------ | :------------------------ |
| PAYMENT_PROVIDER_CREATE | New payment provider is created | `{ paymentProvider: {} }` |
| PAYMENT_PROVIDER_UPDATE | Payment provider is update      | `{ paymentProvider: {} }` |
| PAYMENT_PROVIDER_REMOVE | Payment provider is removed     | `{ paymentProvider: {} }` |

#### `core-payment`

| Event name              | Emitted when...                 | `payload`                 |
| :---------------------- | :------------------------------ | :------------------------ |
| PAYMENT_PROVIDER_CREATE | New payment provider is created | `{ paymentProvider: {} }` |
| PAYMENT_PROVIDER_UPDATE | Payment provider is update      | `{ paymentProvider: {} }` |
| PAYMENT_PROVIDER_REMOVE | Payment provider is removed     | `{ paymentProvider: {} }` |

#### `core-warehousing`

| Event name                  | Emitted when...                     | `payload`                     |
| :-------------------------- | :---------------------------------- | :---------------------------- |
| WAREHOUSING_PROVIDER_CREATE | New warehousing provider is created | `{ warehousingProvider: {} }` |
| WAREHOUSING_PROVIDER_UPDATE | Warehousing provider is update      | `{ warehousingProvider: {} }` |
| WAREHOUSING_PROVIDER_REMOVE | Warehousing provider is removed     | `{ warehousingProvider: {} }` |

#### `core-enrollments`

| Event name        | Emitted when...           | `payload`            |
| :---------------- | :------------------------ | :------------------- |
| ENROLLMENT_CREATE | New enrollment is created | `{ enrollment: {} }` |

### Tracking custom events

In addition to the built in event that come with unchained you can register your own custom event easily.

In order to do this, The custom events need to be registered at platform boot time using `registerEvents` helper function that takes array of event names to be tracked.

```
import { registerEvents } from '@unchainedshop/core-events';

...
startPlatform({...});
...
registerEvents([
  'CUSTOM_EVENT_ONE',
  'CUSTOM_EVENT_TWO',
  'CUSTOM_EVENT_THREE',
])
```

After initializing this at system start up, you can `emit` and `subscribe` in your code base.

```
import { registerEvents } from '@unchainedshop/core-events';

subscribe('CUSTOM_EVENT_ONE', ({ payload }) => {
    console.log(payload.from);
});

emit('CUSTOM_EVENT_ONE', { from: "fcustom event one"});;


```

NOTE: before you can subscribe to an event, make sure it's registered first. Otherwise error will be thrown.

## Setup custom event tracker

We can easily swap the default event tracker module (EventEmitter) used by unchained with out own module by implementing `EventAdapter` interface and registering it on `EventDirector` on system boot time. Both classes are exported from the `core-events` module.

```
import redis from 'redis';
import EventDirector, { EventAdapter } from '@unchainedshop/core-events';

const { REDIS_PORT = 6379, REDIS_HOST = '127.0.0.1' } = process.env;

class RedisEventEmitter extends EventAdapter {
  redisPublisher = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  redisSubscriber = redis.createClient({
    port: REDIS_PORT,
    host: REDIS_HOST,
  });

  publish(eventName, payload) {
    this.redisPublisher.publish(eventName, JSON.stringify(payload));
  }

  subscribe(eventName, callback) {
    this.redisSubscriber.on('message', (_channelName, payload) =>
      callback(payload)
    );
      this.redisSubscriber.subscribe(eventName);
    }
  }
}

const handler = new RedisEventEmitter();

EventDirector.setEventAdapter(handler);


  startPlatform({...});
  ...
  registerEvents([
      'CUSTOM_EVENT_ONE',
      'CUSTOM_EVENT_TWO',
      'CUSTOM_EVENT_THREE',
  ])


```

Explanation:

We have decided to use `redis` for event tracking. In order to do that we have to create new class extending the `EventAddapter` interface and implement the two functions required `subscribe` & `publish`.

in this functions we defined how redis implements the pub/sub model.

Next all we need to is register it in `EventDirector` class using the static function `setEventAdapter`.
