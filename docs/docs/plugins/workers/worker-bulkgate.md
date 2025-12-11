---
sidebar_position: 45
title: BulkGate SMS Worker
sidebar_label: BulkGate SMS
description: Send SMS messages through BulkGate
---

# BulkGate SMS Worker

Send transactional and promotional SMS messages through the BulkGate service.

## Installation

```typescript
import '@unchainedshop/plugins/worker/bulkgate';
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BULKGATE_APPLICATION_ID` | Your BulkGate application ID |
| `BULKGATE_APPLICATION_TOKEN` | Your BulkGate application token |

## Usage

### Transactional SMS

```graphql
mutation SendTransactionalSMS {
  createWork(
    type: "BULKGATE"
    input: {
      to: "+1234567890"
      text: "Your order #123 has shipped!"
      from: "YourCompany"
    }
  ) {
    _id
    status
  }
}
```

### Promotional SMS

```graphql
mutation SendPromotionalSMS {
  createWork(
    type: "BULKGATE"
    input: {
      to: "+1234567890;+0987654321"  # Semicolon-separated for multiple recipients
      text: "Special offer: 20% off!"
      promotional: true
    }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `to` | String | - | Phone number(s) in international format |
| `text` | String | - | SMS message content |
| `from` | String | - | Sender name (uses `gText` sender type) |
| `unicode` | Boolean | `false` | Enable unicode character support |
| `country` | String | - | Country code for number validation |
| `schedule` | String/Number | - | ISO 8601 date or Unix timestamp for scheduled delivery |
| `promotional` | Boolean | `false` | Use promotional API (allows multiple recipients) |

## Sender Types

- **Without `from`**: Uses `gSystem` (system number)
- **With `from`**: Uses `gText` (custom alphanumeric sender, max 11 chars)

## Result

```json
{
  "sms_id": "123456789",
  "price": 0.05,
  "credit": 99.95,
  "number": "+1234567890",
  "status": "accepted"
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.bulkgate` |
| Type | `BULKGATE` |
| Source | [worker/bulkgate.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/bulkgate.ts) |

## External Resources

- [BulkGate API Documentation](https://help.bulkgate.com/docs/en/http-simple-transactional-post-json.html)
- [BulkGate Portal](https://portal.bulkgate.com/)

## Related

- [Twilio SMS Worker](./twilio.md)
- [BudgetSMS Worker](./worker-budgetsms.md)
- [Plugins Overview](./)
