---
sidebar_position: 4
title: Send Message Delivery
sidebar_label: Send Message
description: Digital delivery via messaging adapter
---

# Send Message Delivery Adapter

Forwards order details via the messaging system instead of shipping anything: on delivery, it queues a `MESSAGE` work item that renders the `DELIVERY` template and emails the order to a configurable recipient. Use it for digital goods or to notify a fulfillment party.

:::info Included in All Preset
Registered automatically by `registerAllPlugins()`.
:::

If you use the `base` preset or register plugins individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { SendMessagePlugin } from '@unchainedshop/plugins/delivery/send-message';

pluginRegistry.register(SendMessagePlugin);
```

## Setup

```graphql
mutation CreateSendMessageDelivery {
  createDeliveryProvider(deliveryProvider: {
    type: SHIPPING
    adapterKey: "shop.unchained.delivery.send-message"
  }) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.delivery.send-message` |
| Type | `SHIPPING` |
| Source | [delivery/send-message](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/delivery/send-message) |

## Configuration Options

Set via the provider configuration (Admin UI or `updateDeliveryProvider`):

| Key | Description | Default |
|-----|-------------|---------|
| `from` | Sender email address | `EMAIL_FROM` env var, falling back to `noreply@unchained.local` |
| `to` | Recipient email address | `orders@unchained.local` |
| `cc` | CC email address | Empty |

The defaults are applied by the built-in `DELIVERY` message template, which renders a plain-text order summary (subject and footer use the `EMAIL_WEBSITE_NAME` and `EMAIL_WEBSITE_URL` env vars).

## Behavior

`isActive()` returns `true`. `send()` queues a worker job:

```typescript
modules.worker.addWork({
  type: 'MESSAGE',
  retries: 0,
  input: {
    template: 'DELIVERY',
    orderId: order._id,
    config,
  },
});
```

## Customizing the Message

Override the built-in `DELIVERY` template by registering your own resolver after `startPlatform` (startup registers the built-in templates, so anything registered earlier is overwritten):

```typescript
import { MessagingDirector, type TemplateResolver } from '@unchainedshop/core';

const resolveDeliveryTemplate: TemplateResolver = async ({ config, orderId }, context) => {
  const order = await context.modules.orders.findOrder({ orderId });
  const configObject = Object.fromEntries(config.map(({ key, value }) => [key, value]));

  return [
    {
      type: 'EMAIL',
      input: {
        from: configObject.from,
        to: configObject.to,
        cc: configObject.cc,
        subject: `Your order ${order.orderNumber}`,
        text: 'Your download is ready.',
      },
    },
  ];
};

MessagingDirector.registerTemplate('DELIVERY', resolveDeliveryTemplate);
```

## Related

- [Post Delivery](./delivery-post.md) - Physical shipping
- [Worker](../../extend/worker.md) - Background job processing
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
