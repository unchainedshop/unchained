---
title: "Module: Events"
description: Configure the Events Module
---

Unchained supports a publish-subscribe (pub/sub) event model to keep track of events emitted in each module. By default it uses nodejs EventEmitter module to handle events but can easily extended to use any event tracker module by extending the `EventAdapter` class which we will briefly see later.

The `unchained:core-events` module exports three utility functions that can be used to interact with the registered event tracket.

- `registerEvents`: add's custom events that will be tracked. it takes array of event names.
- `emit`: used to emit events, either pre-built events or custom events registered using `registerEvents`
- `subscribe`: used for subscribing to events emitted from the registered event tracker.

Note: to get list of pre-built or custom events registered on unchained use `EventType` resolver inside GraphQL playground.

Every event emitted from the engine is an object that has one property `payload` which is also an object that has different properties based on the event. We recommend you follow the same pattern when implementing custom events.

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
