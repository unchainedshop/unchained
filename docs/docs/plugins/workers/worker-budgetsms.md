---
sidebar_position: 46
title: BudgetSMS Worker
sidebar_label: BudgetSMS
description: Send SMS messages through BudgetSMS
---

# BudgetSMS Worker

Send SMS messages through the BudgetSMS service with support for test mode.

## Installation

```typescript
import '@unchainedshop/plugins/worker/budgetsms';
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BUDGETSMS_USERNAME` | Your BudgetSMS username (alphanumeric) |
| `BUDGETSMS_USERID` | Your BudgetSMS user ID (**numeric only**) |
| `BUDGETSMS_HANDLE` | Your BudgetSMS API handle (alphanumeric) |

:::warning UserID Must Be Numeric
The `BUDGETSMS_USERID` must contain only numbers. You can find it in your BudgetSMS control panel after login.
:::

## Usage

### Send Real SMS

```graphql
mutation SendSMS {
  createWork(
    type: "BUDGETSMS"
    input: {
      to: "+41791234567"
      text: "Your verification code is 123456"
      from: "YourCompany"
      price: true   # Include price info in response
      credit: true  # Include remaining credit in response
    }
  ) {
    _id
    status
  }
}
```

### Test Mode (No Credit Deducted)

```graphql
mutation TestSMS {
  createWork(
    type: "BUDGETSMS"
    input: {
      to: "+41791234567"
      text: "Test message"
      from: "YourCompany"
      test: true
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
| `to` | String | - | Phone number in international format (required) |
| `text` | String | - | SMS message content |
| `from` | String | - | Sender name (max 11 alphanumeric or 16 numeric chars) |
| `test` | Boolean | `false` | Use test endpoint (no credit deducted) |
| `customid` | String | - | Custom ID for tracking |
| `price` | Boolean | `false` | Include price info in response |
| `mccmnc` | Boolean | `false` | Include carrier info in response |
| `credit` | Boolean | `false` | Include remaining credit in response |

## Result

### Success

```json
{
  "sms_id": "123456789",
  "status": "sent",
  "test_mode": false,
  "price": 0.05,
  "parts": 1,
  "remaining_credit": 99.95
}
```

### Test Mode Success

```json
{
  "sms_id": "123456789",
  "status": "test_successful",
  "test_mode": true,
  "message": "Test SMS validated successfully (no credit deducted)"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 1001 | Authentication failed OR insufficient credit |
| 1002 | Account not active |
| 1003 | Insufficient credit |
| 2001 | SMS message text is empty |
| 2005 | Destination number too short |
| 2012 | SMS message text too long |

:::tip Error 1001 Ambiguity
BudgetSMS returns error 1001 for both authentication failures AND when you have zero credit. Use the test endpoint to distinguish between these cases.
:::

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.budgetsms` |
| Type | `BUDGETSMS` |
| Source | [worker/budgetsms.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/budgetsms.ts) |

## External Resources

- [BudgetSMS API Documentation](https://www.budgetsms.net/sms-http-api/send-sms/)
- [BudgetSMS Control Panel](https://www.budgetsms.net/)

## Related

- [Twilio SMS Worker](./twilio.md)
- [BulkGate SMS Worker](./worker-bulkgate.md)
- [Plugins Overview](./)
