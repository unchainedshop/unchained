---
sidebar_position: 4
sidebar_label: Events
title: Event System
---

:::
 How to use the built-in Event system
:::

Unchained supports the publish-subscribe (pub/sub) event model to keep track of events emitted in each module. By default it uses nodejs EventEmitter module to handle events but the system can be extended to connect to distributed event queues.

You can subscribe to events to trigger any custom logic you can think of. It is especially useful to track data server-side for analytics purposes or to trigger additional e-mails based on special workflows.

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
| ASSORTMENT_ADD_LINK          | Assortment link is created               | `{ assortmentLink: {} }`                                    |
| ASSORTMENT_ADD_PRODUCT       | Product is added to an assortment        | `{ assortmentProduct: {} }`                                 |
| ASSORTMENT_REMOVE            | Assortment is deleted                    | `{ assortmentId: string }`                                  |
| ASSORTMENT_REMOVE_FILTER     | Assortment filter is deleted             | `{ assortmentFilterId: string }`                            |
| ASSORTMENT_REMOVE_LINK       | Assortment link is removed               | `{ assortmentLinkId: string }`                              |
| ASSORTMENT_REORDER_PRODUCTS  | Assortment product sort order is updated | `{ assortmentProducts: [] }`                                |
| ASSORTMENT_REORDER_FILTERS   | Assortment filters sort order is updated | `{ assortmentFilters: [] }`                                 |
| ASSORTMENT_REORDER_LINKS     | Assortment link is updated               | `{ assortmentLinks: [] }`                                   |
| ASSORTMENT_SET_BASE          | Assortment is set as base assortment     | `{ assortmentId: string }`                                  |
| ASSORTMENT_UPDATE            | Assortment is updated                    | `{ assortmentId: string }`                                  |
| ASSORTMENT_UPDATE_TEXT       | Assortment text is updated               | `{ assortmentId: string, text: {} }`                        |
| ASSORTMENT_ADD_MEDIA         | Media is added for a product             | `{ assortmentMedia: {} }`                                   |
| ASSORTMENT_REMOVE_MEDIA      | Media is deleted from a product          | `{ assortmentMediaId: string }`                             |
| ASSORTMENT_UPDATE_MEDIA_TEXT | Product media text is updated            | `{ assortmentMediaId: string, text: {} }`                   |

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
| PRODUCT_REMOVE_ASSIGNMENT       | Proxy assignment is removed from a configurable product      | `{ productId: string }`                                                   |
| PRODUCT_REMOVE_MEDIA            | Media is deleted from a product                              | `{ productMediaId: string }`                                              |
| PRODUCT_REMOVE_REVIEW           | Product review is deleted                                    | `{ productReviewId: string }`                                             |
| PRODUCT_REMOVE_REVIEW_VOTE      | Product review vote is removed                               | `{ productReviewId: string, type: string, userId: string }`               |
| PRODUCT_REMOVE_VARIATION        | Product variation is removed from a product                  | `{ productVariationId: string }`                                          |
| PRODUCT_REMOVE_VARIATION_OPTION | Product variation option is removed                          | `{ productVariationId: string, productVariationOptionValue: {} }`         |
| PRODUCT_REORDER_MEDIA           | Product media sort order is updated                          | `{ productMedias: [] }`                                                   |
| PRODUCT_UNPUBLISH               | Product is unpublished                                       | `{ product: {} }`                                                         |
| PRODUCT_PUBLISH                 | product is published                                         | `{ product: {} }`                                                         |
| PRODUCT_UPDATE                  | product is updated                                           | `{ productId: string, type: string, [commerce,support,warehousing]: {} }` |
| PRODUCT_UPDATE_MEDIA_TEXT       | Product media text is updated                                | `{ productMediaId: string, text: {} }`                                    |
| PRODUCT_UPDATE_REVIEW           | Product review is updated                                    | `{ productReview: {} }`                                                   |
| PRODUCT_UPDATE_TEXT             | Product text is updated                                      | `{ productId: {}, text: [] }`                                             |
| PRODUCT_UPDATE_VARIATION_TEXT   | product variation text is updated                            | `{ productVariationId: string, productVariationOptionValue: string, text: {} }` |

#### `core-orders`

| Event name                  | Emitted when...                                | `payload`                                      |
| :-------------------------- | :--------------------------------------------- | :--------------------------------------------- |
| ORDER_UPDATE_DELIVERY       | Order delivery information is updated          | `{ orderDelivery: {} }`                        |
| ORDER_SIGN_PAYMENT          | Order payment provider is signed               | `{ orderPayment: {}, transactionContext: {} }` |
| ORDER_REMOVE                | Order is deleted                               | `{ orderId: string }`                          |
| ORDER_ADD_PRODUCT           | Product is added to an order                   | `{ orderPosition : {} }`                       |
| ORDER_CONFIRMED             | Order is confirmed                             | `{ order: {} }`                                |
| ORDER_FULLFILLED            | All requested items are fullfiled for an order | `{ order: {} }`                                |
| ORDER_REJECTED              | Order is rejected                              | `{ order: {} }`                                |
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
| BOOKMARK_REMOVE | Bookmark is removed     | `{ bookmarkId: string }` |
| BOOKMARK_UPDATE | Bookmark is updated     | `{ bookmarkId: string }` |
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
| FILTER_UPDATE_TEXT | Filter text updated     | `{ filterId: string, filterOptionValue: string, text: {} }` |

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