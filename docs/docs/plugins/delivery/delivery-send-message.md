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
import '@unchainedshop/plugins/delivery/send-message';
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
| Auto-release | Default (configurable) |
| Source | [delivery/send-message.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/delivery/send-message.ts) |

## Configuration Options

| Key | Description | Default |
|-----|-------------|---------|
| `from` | Sender email address | Empty |
| `to` | Recipient email (overrides order email) | Empty |
| `cc` | CC email address | Empty |

## Behavior

### `isActive()`
Always returns `true`.

### `send()`
Creates a worker job with the `MESSAGE` type using the `DELIVERY` template:

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

Configure the `DELIVERY` template in your messaging setup:

```typescript
import { pluginRegistry } from '@unchainedshop/core';

const DeliveryTemplate = {
  key: 'DELIVERY',
  label: 'Delivery Notification',
  version: '1.0.0',

  actions: (config, context) => ({
    async send() {
      const { orderId, config: deliveryConfig } = context.work.input;
      const { modules } = context;

      const order = await modules.orders.findOrder({ orderId });
      const items = await modules.orders.positions.findOrderPositions({ orderId });

      // Generate download links, license keys, etc.
      const deliveryContent = await generateDeliveryContent(items);

      return {
        to: deliveryConfig.to || order.contact.emailAddress,
        from: deliveryConfig.from,
        cc: deliveryConfig.cc,
        subject: `Your order ${order.orderNumber} - Download Ready`,
        html: renderDeliveryEmail(order, deliveryContent),
      };
    },
  }),
};

pluginRegistry.register({ key: DeliveryTemplate.key, label: DeliveryTemplate.label, version: DeliveryTemplate.version, adapters: [DeliveryTemplate] });
```

## Custom Digital Delivery Adapter

For more complex digital delivery scenarios, register a shipping provider whose `send` callback prepares the digital assets and queues the message:

```typescript
import { registerShippingDelivery } from '@unchainedshop/core';

registerShippingDelivery({
  adapterId: 'digital-delivery',
  estimatedDeliveryThroughput: async () => 0,
  send: async (configuration, { order }) => {
    if (!order) return false;
    const positions = await orderRepository.findPositions(order._id);
    const deliveryItems = await createDigitalDeliveryItems(positions, order);

    await enqueueMessage({
      type: 'MESSAGE',
      input: {
        template: 'DIGITAL_DELIVERY',
        orderId: order._id,
        deliveryItems,
      },
    });

    return true;
  },
});
```

## Combining with Physical Delivery

For products with both physical and digital components:

```typescript
async send() {
  const { order, modules } = context;
  const positions = await modules.orders.positions.findOrderPositions({
    orderId: order._id,
  });

  const digitalItems = positions.filter(p => p.product?.meta?.isDigital);
  const physicalItems = positions.filter(p => !p.product?.meta?.isDigital);

  // Handle digital items immediately
  if (digitalItems.length > 0) {
    await modules.worker.addWork({
      type: 'MESSAGE',
      input: {
        template: 'DIGITAL_DELIVERY',
        orderId: order._id,
        items: digitalItems,
      },
    });
  }

  // Physical items handled by warehouse
  return {
    digitalDelivered: digitalItems.length,
    physicalPending: physicalItems.length,
  };
}
```

## Related

- [Plugins Overview](./) - All available plugins
- [Post Delivery](./delivery-post.md) - Physical shipping
- [Worker](../../extend/worker.md) - Background job processing
- [Custom Delivery Plugins](../../extend/order-fulfilment/fulfilment-plugins/delivery.md) - Write your own
