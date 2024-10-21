---
sidebar_position: 7
title: Twilio SMS Communication
sidebar_labe: Twilio SMS Communication
---
# Twilio SMS Communication
:::
Usage and Configuration Options for the Twilio SMS Plugin
:::

You can send SMS with arbitrary providers through Unchained's work system. To add a new SMS to the system, you can use the `addWork` mutation:
```/*graphql*/
addWork(type: SMS, input: {
  to: "<number>",
  text: "<text>"
}) {
  _id
}
```

The twilio module automatically picks up any work items with type `SMS` and sends them for you.

### Configuration
## Environment variables


| NAME                      | Description                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`      |                                                                                          |
| `TWILIO_AUTH_TOKEN`       |                                                                                          |
| `TWILIO_SMS_FROM`         | Number that the SMS is sent from. Needs to correspond to a number in your Twilio account |