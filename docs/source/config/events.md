---
title: "Module: Events"
description: Configure the Events Module
---

Unchained supports a publish-subscribe (pub/sub) event model to keep track of events emitted in each module. By default it uses nodejs EventEmitter module to handle events but can easily extended to use any event tracker module by extending the `EventAdapter` class which we will briefly see later.

The `unchained:core-events` module exports three utility functions that can be used to interact with the registered event tracket.

- `registerEvents`: add's custom events that will be tracked. it takes array of event names.
- `emit(eventName, payload)`: used to emit events, either pre-built events or custom events registered using `registerEvents`. It take two arguments, name of the event we want to emit and the data associated with the event.
- `subscribe(eventName: callBack)`: used for subscribing to events emitted from the registered event tracker. it takes two arguments, name of the event we want to subscribe to and a call back that will be provided one argument holding data for the associated event.

Note: to get list of pre-built or custom events registered on unchained use `EventType` resolver inside GraphQL playground.

Every event emitted from the engine is an object that has one property `payload` which is also an object that has different properties based on the event. We recommend you follow the same pattern when implementing custom events.

## Built in Events

Bellow are events tracked under each module under the box:

#### `core-assortments`:

| Event name                  | `payload`                                                   |
| :-------------------------- | :---------------------------------------------------------- |
| ASSORTMENT_CREATE           | `{ assortment: {} }`                                        |
| ASSORTMENT_ADD_FILTER       | `{ assortmentFilter: {} }`                                  |
| ASSORTMENT_ADD_LINK         | `{ parentAssortmentId: string, childAssortmentId: string }` |
| ASSORTMENT_ADD_PRODUCT      | `{ assortmentProduct: {} }`                                 |
| ASSORTMENT_REMOVE           | `{ assortmentId: string }`                                  |
| ASSORTMENT_REMOVE_FILTER    | `{ assortmentFilterId: string }`                            |
| ASSORTMENT_REMOVE_LINK      | `{ assortmentLinkId: string }`                              |
| ASSORTMENT_REORDER_PRODUCTS | `{ assortmentProducts: [] }`                                |
| ASSORTMENT_REORDER_FILTERS  | `{ assortmentFilters: [] }`                                 |
| ASSORTMENT_REORDER_LINKS    | `{ assortmentLinks: [] }`                                   |
| ASSORTMENT_SET_BASE         | `{ assortmentId: string }`                                  |
| ASSORTMENT_UPDATE           | `{ assortmentId: string }`                                  |
| ASSORTMENT_UPDATE_TEXTS     | `{ assortmentId: string, assortmentTexts: [] }`             |

#### `core-products`

| Event name                      | `payload`                                                                 |
| :------------------------------ | :------------------------------------------------------------------------ |
| PRODUCT_ADD_ASSIGNMENT          | `{ productId: string, proxyId: string }`                                  |
| PRODUCT_ADD_MEDIA               | `{ productMedia: {} }`                                                    |
| PRODUCT_REVIEW_ADD_VOTE         | `{ productReview: {} }`                                                   |
| PRODUCT_CREATE                  | `{ product: {} }`                                                         |
| PRODUCT_CREATE_BUNDLE_ITEM      | `{ productId: string }`                                                   |
| PRODUCT_REVIEW_CREATE           | `{ productReview : {} }`                                                  |
| PRODUCT_CREATE_VARIATION        | `{ productVariation: {} }`                                                |
| PRODUCT_VARIATION_OPTION_CREATE | `{ productVariation: {} }`                                                |
| PRODUCT_REMOVE_BUNDLE_ITEM      | `{ productId: string, item: {} }`                                         |
| PRODUCT_REMOVE                  | `{ productId: string }`                                                   |
| PRODUCT_REMOVE_ASSIGNMENT       | `{ productId: string }`                                                   |
| PRODUCT_REMOVE_MEDIA            | `{ productMediaId: string }`                                              |
| PRODUCT_REMOVE_REVIEW           | `{ productReviewId: string }`                                             |
| PRODUCT_REMOVE_REVIEW_VOTE      | `{ productReviewId: string, type: string, userId: string }`               |
| PRODUCT_REMOVE_VARIATION        | `{ productVariationId: string }`                                          |
| PRODUCT_REMOVE_VARIATION_OPTION | `{ productVariationId: string, productVariationOptionValue: {} }`         |
| PRODUCT_REORDER_MEDIA           | `{ productMedias: [] }`                                                   |
| PRODUCT_UNPUBLISH               | `{ product: {} }`                                                         |
| PRODUCT_PUBLISH                 | `{ product: {} }`                                                         |
| PRODUCT_UPDATE                  | `{ productId: string, type: string, [commerce,support,warehousing]: {} }` |
| PRODUCT_UPDATE_MEDIA_TEXT       | `{productMedia: {}, mediaTexts: {} }`                                     |
| PRODUCT_UPDATE_REVIEW           | `{ productReview: {} }`                                                   |
| PRODUCT_UPDATE_TEXTS            | `{ product: {}, productTexts: [] }`                                       |
| PRODUCT_UPDATE_VARIATION_TEXTS  | `{ productVariation: {}, productVariationTexts: [] }`                     |

#### `core-orders`

| Event name                  | `payload`                                      |
| :-------------------------- | :--------------------------------------------- |
| ORDER_UPDATE_DELIVERY       | `{ orderDelivery: {} }`                        |
| ORDER_SIGN_PAYMENT          | `{ orderPayment: {}, transactionContext: {} }` |
| ORDER_REMOVE                | `{ orderId: string }`                          |
| ORDER_ADD_PRODUCT           | `{ orderPosition : {} }`                       |
| ORDER_ADD_DISCOUNT          | `{ discount: {} }`                             |
| ORDER_CONFIRMED             | `{ order: {} }`                                |
| ORDER_FULLFILLED            | `{ order: {} }`                                |
| ORDER_UPDATE_DELIVERY       | `{ orderDelivery: {} }`                        |
| ORDER_UPDATE_PAYMENT        | `{ orderPayment: {} }`                         |
| ORDER_CREATE                | `{ order: {} }`                                |
| ORDER_UPDATE                | `{ order: {}, field: string }`                 |
| ORDER_SET_PAYMENT_PROVIDER  | `{ order: {}, paymentProviderId: string }`     |
| ORDER_SET_DELIVERY_PROVIDER | `{ order: {}, deliveryProviderId: string }`    |
| ORDER_EMPTY_CART            | `{ orderId: string, count: number }`           |
| ORDER_UPDATE_CART_ITEM      | `{ orderPosition: {} }`                        |
| ORDER_REMOVE_CART_ITEM      | `{ orderPosition: {} }`                        |
| ORDER_UPDATE_DISCOUNT       | `{ discount: {} }`                             |
| ORDER_REMOVE_DISCOUNT       | `{ discount: {} }`                             |

#### `core-bookmarks`

| Event name      | `payload`                |
| :-------------- | :----------------------- |
| BOOKMARK_CREATE | `{ bookmarkId: string }` |
| BOOKMARK_REMOVE | `{ bookmarkId: string }` |

### Tracking custom events

In addition to the built in event that come with unchained you can register your own custom event easily.

In order to do this, The custom events need to be registered at platform boot time using `registerEvents` helper function that takes array of event names to be tracked.

```
import { Meteor } from 'meteor/meteor';
import { registerEvents } from 'meteor/unchained:core-events';

Meteor.startup(() => {
  ...
  startPlatform({...});
  ...
  registerEvents([
      'CUSTOM_EVENT_ONE',
      'CUSTOM_EVENT_TWO',
      'CUSTOM_EVENT_THREE',
  ])
});
```

After initializing this at system start up, you can `emit` and `subscribe` in your code base.

```
import { registerEvents } from 'meteor/unchained:core-events';

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
import EventDirector, { EventAdapter } from 'meteor/unchained:core-events';

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

  subscribe(eventName, callBack) {
    this.redisSubscriber.on('message', (_channelName, payload) =>
      callBack(payload)
    );
      this.redisSubscriber.subscribe(eventName);
    }
  }
}

const handler = new RedisEventEmitter();

EventDirector.setEventAdapter(handler);

Meteor.startup(() => {
  ...
  startPlatform({...});
  ...
  registerEvents([
      'CUSTOM_EVENT_ONE',
      'CUSTOM_EVENT_TWO',
      'CUSTOM_EVENT_THREE',
  ])
});

```

Explanation:

We have decided to use `redis` for event tracking. In order to do that we have to create new class extending the `EventAddapter` interface and implement the two functions required `subscribe` & `publish`.

in this functions we defined how redis implements the pub/sub model.

Next all we need to is register it in `EventDirector` class using the static function `setEventAdapter`.
