---
sidebar_position: 4
title: Send Message Delivery
sidebar_label: Send Message
description: Digital delivery via messaging adapter
---

# Send Message Delivery Adapter

The Send Message adapter provides digital delivery functionality by sending order details via the messaging system.

## Installation

```typescript
import '@unchainedshop/plugins/delivery/send-message.js';
```

## Configuration

Create a delivery provider for digital products:

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

Configure the provider after creation using the Admin UI or by updating the provider's configuration:

```json
[
  { "key": "from", "value": "shop@example.com" },
  { "key": "to", "value": "" },
  { "key": "cc", "value": "fulfillment@example.com" }
]
```

## Features

- Digital product delivery
- Email-based fulfillment
- Configurable recipients
- Worker-based message queue
- Template-based messaging

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.delivery.send-message` |
| Type | `SHIPPING` |
| Auto-release | `true` (inherited from DeliveryAdapter) |
| Source | [delivery/send-message.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/delivery/send-message.ts) |

## Configuration Options

| Key | Description | Default |
|-----|-------------|---------|
| `from` | Sender used by the default DELIVERY template | `EMAIL_FROM`, then `noreply@unchained.local`, when empty |
| `to` | Recipient used by the default DELIVERY template | `orders@unchained.local` when empty |
| `cc` | CC email address | Empty |

## Behavior

### `isActive()`
Always returns `true`.

### `send()`
Returns a worker job with the `MESSAGE` type using the `DELIVERY` template. The director marks delivery as delivered when the work is queued, before the downstream message has finished:

```typescript
await modules.worker.addWork({
  type: 'MESSAGE',
  retries: 0,
  input: {
    template: 'DELIVERY',
    orderId: order._id,
    config,
  },
});
```

## Use Cases

### Digital Products
Ideal for:
- Software licenses
- Download links
- Access codes
- E-books and digital media
- Event tickets
- Gift cards

### Notification Delivery
Send order details to:
- Customer email
- Fulfillment center
- Third-party systems

## Message Template

The platform registers a default `DELIVERY` resolver that forwards order details to the configured recipient. It does not fall back to the customer's email address. Override it after platform initialization when delivering customer-specific content:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('DELIVERY', async ({ orderId, config }, { modules }) => {
  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new Error('Order not found');
  const settings = Object.fromEntries(config.map(({ key, value }) => [key, value]));
  const recipient = settings.to || order.contact?.emailAddress;
  if (!recipient) throw new Error('Delivery recipient missing');

  return [{
    type: 'EMAIL',
    input: {
      from: settings.from || process.env.EMAIL_FROM,
      to: recipient,
      cc: settings.cc,
      subject: `Your order ${order.orderNumber}`,
      text: 'Your order is ready.',
    },
  }];
});
```

Templates are resolver functions registered with `registerTemplate`; they are not director adapters. Register the `MESSAGE` and `EMAIL` worker plugins to process these jobs.

For license keys or download links, load positions through `modules.orders.positions.findOrderPositions` and localized product text through `modules.products.texts.findLocalizedText`. Position documents do not embed products, and product documents do not embed localized texts. Generate digital content in your own service and pass it to the template.

## Related

- [Plugins Overview](./) - All available plugins
- [Post Delivery](./delivery-post.md) - Physical shipping
- [Worker](../../extend/worker.md) - Background job processing
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
