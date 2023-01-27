---
title: 'Push Notification (W3C compliant)'
description: Configuring W3C based push notification service
---


Push notifications are a powerful tool for communicating with users even when your website is not currently open in their browser. The W3C Web Platform API provides the Push API and Notifications API, which allows you to send push notifications to users who have granted permission.

To set up push notifications, you'll need to generate a private and public key pair, which will be used to authenticate your service. Once you have the key pair, you'll need to assign the values to environment variables:

- `PUSH_NOTIFICATION_PUBLIC_KEY`: This will hold the public key value that you need to register with the push service.
- `PUSH_NOTIFICATION_PRIVATE_KEY`: This will hold the private key value that you need to use to sign the push messages.

in order to communicate the required vapid key with the store front unchained exposes the value registered on the shop graphql field.

```graphql
shopInfo {
    vapidPublicKey
  }

```
`vapidPublicKey` holds the same value you provided for `PUSH_NOTIFICATION_PUBLIC_KEY` because it's needed for signing in client side.

To manage a user's push subscriptions, you can use the following mutations:

- `addPushSubscription(subscription: JSON!, unsubscribeFromOtherUsers: Boolean)`: Attaches a push subscription object to a user if doesn't already exists. it also accepts a optional parameter to remove other subscriptions from the same application.
-  `removePushSubscription(p256Dh: String!)`: removes a push subscription object of a user from the application identified by the `p256Dh`.

All the push subscription of a user are are exposed through `user.pushSubscriptions`


```graphql
type PushSubscription {
  _id: ID! // p256dh value of the registered application
  endpoint: String!
  expirationTime: Int
  userAgent: String
}

```

The push notification worker automatically picks up any work items with type `PUSH` and sends them for you.
Note that even if the user enabled push notification Email notification will also be triggered along with each notification because push notification might not be viewed or noticed by a user at the time of sending.

# Configuration
## Environment variables


| NAME                      | Description                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `PUSH_NOTIFICATION_PUBLIC_KEY`      |   public key value that you need to register with the push service                                                                                       |
| `PUSH_NOTIFICATION_PRIVATE_KEY`       |     private key value that you need to use to sign the push messages                                                                                     |