---
sidebar_position: 7
title: Messaging
description: Configure email and SMS messaging templates for notifications, order confirmations, and custom alerts.
sidebar_label: Messaging
---

# Messaging

Unchained Engine includes an event-driven messaging system that sends notifications via email or SMS. Messages are processed asynchronously through the worker queue.

## Architecture

```mermaid
flowchart LR
    E[Platform Event] -->|triggers| M[MESSAGE Work]
    M -->|resolves template| T[TemplateResolver]
    T -->|creates| W1[EMAIL Work]
    T -->|creates| W2[SMS Work]
    W1 -->|processed by| WK1[Email Worker]
    W2 -->|processed by| WK2[SMS Worker]
```

1. A platform event (e.g., `ORDER_CONFIRMED`) triggers a `MESSAGE` work item
2. The Message Worker resolves the template registered for that message type
3. The template resolver returns one or more concrete work items (EMAIL, SMS, etc.)
4. Each work item is processed by the corresponding worker adapter

## Built-in Message Types

Unchained registers 7 default message templates:

| Template | Trigger | Description |
|----------|---------|-------------|
| `ACCOUNT_ACTION` | User registration, password reset, email verification | Account lifecycle emails with action URLs |
| `ORDER_CONFIRMATION` | `ORDER_CHECKOUT`, `ORDER_CONFIRMED` events | Order confirmation sent to the customer |
| `ORDER_REJECTION` | `ORDER_REJECTED` event | Order rejection notification |
| `DELIVERY` | `ORDER_CONFIRMED` event | Forwards order details to internal recipients (warehouse, support) |
| `QUOTATION_STATUS` | Quotation status changes | Quotation update notification |
| `ENROLLMENT_STATUS` | Enrollment status changes | Subscription status notification |
| `ERROR_REPORT` | Worker failures | Sends failed work items to support team |

### ACCOUNT_ACTION

Handles all user account lifecycle emails:

| Action | When | Content |
|--------|------|---------|
| `enroll-account` | New user enrollment | Welcome email with setup link |
| `reset-password` | Password reset request | Reset link with token |
| `verify-email` | Email verification | Verification link |
| *(empty)* | Password changed | Confirmation notice |

Input: `{ userId, action, recipientEmail, token }`

### ORDER_CONFIRMATION

Sent when an order transitions past PENDING status. Includes order details, items, pricing, and delivery info.

Input: `{ orderId, locale }`

### DELIVERY

Forwards order information to internal recipients (e.g., warehouse staff). Configured via the delivery provider's configuration keys:

```graphql
mutation {
  createDeliveryProvider(
    deliveryProvider: {
      type: SHIPPING
      adapterKey: "shop.unchained.delivery.send-message"
      configuration: [
        { key: "from", value: "shop@example.com" }
        { key: "to", value: "warehouse@example.com" }
        { key: "cc", value: "logistics@example.com" }
      ]
    }
  ) { _id }
}
```

### ERROR_REPORT

Automatically sends failed work items to the address configured in `ERROR_REPORT_RECIPIENT` environment variable.

## Custom Templates

### 1. Implement a TemplateResolver

A template resolver is a function that transforms input data into one or more message work configurations:

```typescript
import { TemplateResolver } from '@unchainedshop/core';

const myTemplate: TemplateResolver = async (
  { userId, orderId, customData },
  unchainedAPI
) => {
  const { modules } = unchainedAPI;
  const user = await modules.users.findUserById(userId);
  const email = modules.users.primaryEmail(user);

  return [
    {
      type: 'EMAIL',
      input: {
        from: 'shop@example.com',
        to: email.address,
        subject: 'Your custom notification',
        text: `Hello ${user.profile?.address?.firstName}, ${customData}`,
        html: `<p>Hello <b>${user.profile?.address?.firstName}</b>, ${customData}</p>`,
      },
    },
  ];
};
```

### 2. Register the Template

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('MY_CUSTOM_TEMPLATE', myTemplate);
```

### 3. Trigger the Message

Add a `MESSAGE` work item to the queue:

```typescript
await modules.worker.addWork({
  type: 'MESSAGE',
  retries: 0,
  input: {
    template: 'MY_CUSTOM_TEMPLATE',
    userId,
    orderId,
    customData: 'Your order has been updated.',
  },
});
```

## Overriding Built-in Templates

Register a template with the same name as a built-in type to override it:

```typescript
import { MessagingDirector } from '@unchainedshop/core';

MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async ({ orderId, locale }, api) => {
  const order = await api.modules.orders.findOrder({ orderId });
  const user = await api.modules.users.findUserById(order.userId);
  const email = api.modules.users.primaryEmail(user);

  return [
    {
      type: 'EMAIL',
      input: {
        from: 'shop@example.com',
        to: email.address,
        subject: `Order #${order.orderNumber} confirmed`,
        html: renderOrderEmail(order), // Your custom rendering
      },
    },
  ];
});
```

## Email Attachments

Email templates support three attachment formats:

```typescript
return [
  {
    type: 'EMAIL',
    input: {
      from: 'shop@example.com',
      to: 'customer@example.com',
      subject: 'Your invoice',
      text: 'Please find your invoice attached.',
      attachments: [
        // File path
        { filename: 'invoice.pdf', path: '/tmp/invoice-123.pdf' },

        // Inline content (base64)
        {
          filename: 'data.csv',
          content: Buffer.from(csvData).toString('base64'),
          contentType: 'text/csv',
          encoding: 'base64',
        },

        // URL reference
        { filename: 'receipt.pdf', href: 'https://example.com/receipts/123.pdf' },
      ],
    },
  },
];
```

## Multi-Channel Messages

A single template can return multiple work items for different channels:

```typescript
const orderAlert: TemplateResolver = async ({ orderId }, api) => {
  const order = await api.modules.orders.findOrder({ orderId });

  return [
    {
      type: 'EMAIL',
      input: {
        from: 'shop@example.com',
        to: 'admin@example.com',
        subject: `New order #${order.orderNumber}`,
        text: `Order total: ${order.pricing?.total}`,
      },
    },
    {
      type: 'TWILIO',
      input: {
        from: '+15550001234', // Omit if TWILIO_SMS_FROM env var is set
        to: '+41791234567',
        text: `New order #${order.orderNumber}`,
      },
    },
  ];
};
```

## SMS Providers

### Twilio

Environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`

```typescript
{ type: 'TWILIO', input: { to: '+41791234567', text: 'Hello!' } }
```

### BulkGate

Environment variables: `BULKGATE_APPLICATION_ID`, `BULKGATE_APPLICATION_TOKEN`

```typescript
{ type: 'BULKGATE', input: { to: '+41791234567', text: 'Hello!' } }
```

### BudgetSMS

Environment variables: `BUDGETSMS_USERNAME`, `BUDGETSMS_USERID`, `BUDGETSMS_HANDLE`

```typescript
{ type: 'BUDGETSMS', input: { to: '+41791234567', text: 'Hello!' } }
```

## Email Configuration

### Production

Set the `MAIL_URL` environment variable to your SMTP server:

```bash
MAIL_URL=smtp://user:password@smtp.example.com:587
```

### Development

In non-production mode, emails are intercepted and opened in the browser for preview. Disable this with:

```bash
UNCHAINED_DISABLE_EMAIL_INTERCEPTION=1
```

## MessagingDirector API

```typescript
import { MessagingDirector } from '@unchainedshop/core';

// Register a template
MessagingDirector.registerTemplate(name: string, resolver: TemplateResolver): void

// Get a registered template resolver
MessagingDirector.getTemplate(name: string): TemplateResolver | undefined

// List all registered template names
MessagingDirector.getRegisteredTemplates(): string[]
```

## Related

- [Email Worker](../plugins/workers/worker-email.md) - Email delivery plugin
- [Twilio Worker](../plugins/workers/twilio.md) - SMS via Twilio
- [BulkGate Worker](../plugins/workers/worker-bulkgate.md) - SMS via BulkGate
- [BudgetSMS Worker](../plugins/workers/worker-budgetsms.md) - SMS via BudgetSMS
- [Worker Module](./modules/worker.md) - Background job processing
