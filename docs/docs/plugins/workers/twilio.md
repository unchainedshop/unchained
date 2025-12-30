---
sidebar_position: 7
title: Twilio SMS Worker
sidebar_label: Twilio SMS
description: Send SMS messages through Twilio
---

# Twilio SMS Worker

Send SMS messages through the Twilio messaging service.

## Installation

```typescript
import '@unchainedshop/plugins/worker/twilio';
```

## Usage

You can send SMS with arbitrary providers through Unchained's work system. To add a new SMS to the system, you can use the `addWork` mutation:

```graphql
mutation SendSMS {
  addWork(type: TWILIO, input: {
    to: "+1234567890"
    text: "Your order has shipped!"
    from: "+0987654321"
  }) {
    _id
  }
}
```

Note: The `from` parameter is optional and defaults to `TWILIO_SMS_FROM` env var.

The Twilio worker plugin automatically picks up any work items with type `TWILIO` and sends them for you.

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | String | Yes | Recipient phone number |
| `text` | String | No | SMS message content |
| `from` | String | No | Sender phone number (defaults to `TWILIO_SMS_FROM`) |

Additional Twilio API parameters can be passed and will be forwarded to the API.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_SMS_FROM` | Default sender phone number (must be a Twilio number) |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.twilio` |
| Type | `TWILIO` |
| Source | [worker/twilio.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/twilio.ts) |

## External Resources

- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [Twilio Console (Get Credentials)](https://console.twilio.com/)
- [Twilio Phone Numbers](https://www.twilio.com/docs/phone-numbers)

## Related

- [BulkGate SMS Worker](./worker-bulkgate.md)
- [BudgetSMS Worker](./worker-budgetsms.md)
- [Message Worker](./worker-message.md)
- [Plugins Overview](./)