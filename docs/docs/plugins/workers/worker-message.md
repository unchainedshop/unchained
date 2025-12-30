---
sidebar_position: 49
title: Message Worker
sidebar_label: Message
description: Route messages through templates to concrete delivery workers
---

# Message Worker

Routes messages through template resolvers to create concrete delivery work items (email, SMS, push notifications, etc.).

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/message';
```

## Purpose

The Message Worker is the central routing hub for all notifications in Unchained:

1. Receives a template name and payload
2. Resolves the template using the Messaging Director
3. Creates concrete work items (EMAIL, PUSH, TWILIO, etc.)
4. Links all created work to the original message work

## Usage

```graphql
mutation SendWelcomeMessage {
  addWork(
    type: MESSAGE
    input: {
      template: "ACCOUNT_ACTION"
      userId: "user-id"
      action: "verify-email"
    }
  ) {
    _id
    status
  }
}
```

Note: Any additional payload for the template can be added to the `input` object.

## Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | String | Name of the registered template (required) |
| `...payload` | Any | Additional data passed to the template resolver |

## Registering Templates

Templates are registered using the Messaging Director:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async (payload, context) => {
  const { modules } = context;
  const { orderId } = payload;

  const order = await modules.orders.findOrder({ orderId });
  const user = await modules.users.findUserById(order.userId);

  const workItems = [];

  // Send email
  workItems.push({
    type: 'EMAIL',
    input: {
      to: user.emails[0].address,
      subject: `Order ${order.orderNumber} confirmed`,
      html: `<h1>Thank you for your order!</h1>...`,
    },
  });

  // Send push notification if subscribed
  for (const subscription of user.pushSubscriptions || []) {
    workItems.push({
      type: 'PUSH',
      input: {
        subscription,
        subject: 'https://shop.example.com',
        payload: JSON.stringify({
          title: 'Order Confirmed',
          body: `Order ${order.orderNumber} is confirmed`,
        }),
      },
    });
  }

  return workItems;
});
```

## Result

```json
{
  "forked": [
    { "_id": "email-work-id", "type": "EMAIL", "status": "ALLOCATED" },
    { "_id": "push-work-id", "type": "PUSH", "status": "ALLOCATED" }
  ]
}
```

## Built-in Templates

Unchained uses the following templates internally:

- `ACCOUNT_ACTION` - Email verification, password reset
- `ORDER_CONFIRMATION` - Order confirmed
- `DELIVERY` - Delivery notifications
- `ERROR_REPORT` - Daily error reports

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.message` |
| Type | `MESSAGE` |
| Source | [worker/message.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/message.ts) |

## Related

- [Email Worker](./worker-email.md)
- [Push Notification Worker](./push-notification.md)
- [Twilio SMS Worker](./twilio.md)
- [Plugins Overview](./)
