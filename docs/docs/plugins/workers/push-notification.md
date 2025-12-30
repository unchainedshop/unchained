---
sidebar_position: 5
title: Push Notification Worker
sidebar_label: Push Notification
description: W3C compliant web push notifications
---

# Push Notification Worker

Send W3C compliant web push notifications to subscribed users.

## Installation

```typescript
import '@unchainedshop/plugins/worker/push-notification';
```

### Peer Dependency

This worker requires the `web-push` package:

```bash
npm install web-push
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PUSH_NOTIFICATION_PUBLIC_KEY` | VAPID public key for push service registration |
| `PUSH_NOTIFICATION_PRIVATE_KEY` | VAPID private key for signing push messages |

### Generating VAPID Keys

```bash
npx web-push generate-vapid-keys
```

## Usage

### Send Push Notification

```graphql
mutation SendPush {
  addWork(
    type: PUSH
    input: {
      subscription: {
        endpoint: "https://fcm.googleapis.com/..."
        expirationTime: null
        keys: {
          auth: "auth-key"
          p256dh: "p256dh-key"
        }
      }
      subject: "https://yourshop.com"
      payload: "{\"title\": \"Order Shipped\", \"body\": \"Your order is on its way!\"}"
      urgency: "normal"
    }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subscription` | Object | Yes | User's push subscription object |
| `subject` | String | Yes | URL or mailto identifying your service |
| `payload` | String | Yes | Stringified JSON with `title` and `body` |
| `urgency` | String | No | `very-low`, `low`, `normal`, or `high` |
| `topic` | String | No | Identifier for notification coalescing (max 32 chars) |

### Subscription Object

```json
{
  "endpoint": "https://push-service-url...",
  "expirationTime": null,
  "keys": {
    "auth": "authentication-secret",
    "p256dh": "public-key"
  }
}
```

## GraphQL API

### Get VAPID Public Key

The public key is exposed for client-side subscription:

```graphql
query GetShopInfo {
  shopInfo {
    vapidPublicKey
  }
}
```

### Manage User Subscriptions

Add subscription:

```graphql
mutation AddPushSubscription {
  addPushSubscription(
    subscription: {
      endpoint: "https://fcm.googleapis.com/..."
      expirationTime: null
      keys: {
        auth: "auth-key"
        p256dh: "p256dh-key"
      }
    }
    unsubscribeFromOtherUsers: true
  ) {
    _id
    pushSubscriptions {
      _id
      endpoint
      userAgent
    }
  }
}
```

Remove subscription:

```graphql
mutation RemovePushSubscription {
  removePushSubscription(p256dh: "subscription-p256dh-key") {
    _id
  }
}
```

Note: `unsubscribeFromOtherUsers: true` removes this subscription from other users.

### Query User Subscriptions

```graphql
query GetMySubscriptions {
  me {
    pushSubscriptions {
      _id        # p256dh value
      endpoint
      expirationTime
      userAgent
    }
  }
}
```

## Template Example

Send push notifications via the messaging system:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('ORDER_SHIPPED', async ({ orderId }, context) => {
  const { modules } = context;

  const order = await modules.orders.findOrder({ orderId });
  const user = await modules.users.findUserById(order.userId);

  const pushNotifications = (user?.pushSubscriptions || []).map((subscription) => ({
    type: 'PUSH',
    input: {
      subscription,
      subject: 'https://yourshop.com',
      payload: JSON.stringify({
        title: 'Order Shipped!',
        body: `Your order ${order.orderNumber} is on its way`,
      }),
    },
  }));

  return pushNotifications;
});
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.push-notification` |
| Type | `PUSH` |
| Source | [worker/push-notification.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/push-notification.ts) |

## External Resources

- [W3C Push API Specification](https://www.w3.org/TR/push-api/)
- [web-push npm package](https://www.npmjs.com/package/web-push)
- [Web Push Notifications Guide (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

## Related

- [Message Worker](./worker-message.md)
- [Email Worker](./worker-email.md)
- [Plugins Overview](./)
