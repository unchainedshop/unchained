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
| `DELIVERY` | `send-message` delivery provider sends | Forwards order details to internal recipients (warehouse, support) |
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

Input: `{ userId, action, recipientEmail, token }`

### ORDER_CONFIRMATION

Sent after checkout (while the order is `PENDING`) or when the order is confirmed. Includes order details, items, pricing, and delivery info.

Input: `{ orderId, locale }`

### DELIVERY

Forwards order information to internal recipients (e.g., warehouse staff). Configured via the delivery provider's configuration keys — create the provider first, then set the configuration via `updateDeliveryProvider`:

```graphql
mutation {
  createDeliveryProvider(
    deliveryProvider: {
      type: SHIPPING
      adapterKey: "shop.unchained.delivery.send-message"
    }
  ) { _id }
}
```

```graphql
mutation {
  updateDeliveryProvider(
    deliveryProviderId: "..."
    deliveryProvider: {
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

Automatically sends failed work items to the address configured in the `EMAIL_ERROR_REPORT_RECIPIENT` environment variable (default: `support@unchained.local`).

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

## Customizing the Built-in E-Mails

There are three levels of customization, from cheapest to most involved:

1. **Environment variables** — change sender, shop name and link base URL without any code
2. **Override a built-in template** — replace the resolver for one message type, reusing the built-in helpers
3. **Custom templates** — add entirely new message types (see [Custom Templates](#custom-templates) above)

### Level 1: Environment Variables

The built-in resolvers read their branding and link targets from the environment:

| Variable | Used for | Default |
|----------|----------|---------|
| `EMAIL_FROM` | Sender address of all built-in mails | `noreply@unchained.local` |
| `EMAIL_WEBSITE_NAME` | Shop name in subjects, sender display name and copy | — |
| `EMAIL_WEBSITE_URL` | Base URL for account action links (`/enroll-account?token=…`, `/reset-password?token=…`, `/verify-email?token=…`) and the website link in order mails | — |
| `EMAIL_ERROR_REPORT_RECIPIENT` | Recipient of `ERROR_REPORT` mails | `support@unchained.local` |
| `MAIL_URL` | SMTP server used by the email worker | — |

The account action links assume your storefront serves those three paths and completes the flow with the `token` query parameter. If your routes differ, override `ACCOUNT_ACTION` (level 2).

### Level 2: Overriding a Built-in Template

Register a template with the same name as a built-in type to replace it. Registration is last-write-wins, and the built-ins are registered *inside* `startPlatform` — so **register your override after `startPlatform` has resolved**, otherwise the built-in silently wins:

```typescript
import { startPlatform } from '@unchainedshop/platform';
import { MessagingDirector } from '@unchainedshop/core';

const platform = await startPlatform({ ... });

// ✓ after startPlatform — replaces the built-in resolver
MessagingDirector.registerTemplate('ORDER_CONFIRMATION', myOrderConfirmationResolver);
```

The built-in resolvers are exported from `@unchainedshop/platform` (`resolveOrderConfirmationTemplate`, `resolveAccountActionTemplate`, …), so you can also wrap one instead of rewriting it — e.g. keep the built-in behaviour and only change the subject, or add an SMS work item on top of the e-mail:

```typescript
import { resolveOrderConfirmationTemplate } from '@unchainedshop/platform';

MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async (params, api) => {
  const workItems = await resolveOrderConfirmationTemplate(params, api);
  return workItems.map((item) =>
    item.type === 'EMAIL'
      ? { ...item, input: { ...item.input, subject: `🎉 ${item.input.subject}` } }
      : item,
  );
});
```

For more than cosmetic changes, copy the built-in resolver from `packages/platform/src/templates/` into your project and adapt it — they are small, dependency-free functions.

### Localizing Your Copy

The engine already determines the recipient's locale for you: every built-in `MESSAGE` payload carries a `locale` (derived via `modules.users.userLocale()`, falling back to the system locale), and `ACCOUNT_ACTION` resolvers can re-derive it from the user. Key the copy of your resolver by language and pick with a fallback:

```typescript
const COPY = {
  en: { subject: (n) => `Order ${n} confirmed`, thanks: 'Thank you for your order!' },
  de: { subject: (n) => `Bestellung ${n} bestätigt`, thanks: 'Danke für deine Bestellung!' },
};

MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async ({ orderId, locale }, api) => {
  const order = await api.modules.orders.findOrder({ orderId });
  const language = new Intl.Locale(locale).language;
  const t = COPY[language] ?? COPY.en;

  return [
    {
      type: 'EMAIL',
      input: {
        from: `${process.env.EMAIL_WEBSITE_NAME} <${process.env.EMAIL_FROM}>`,
        to: order.contact.emailAddress,
        subject: t.subject(order.orderNumber),
        text: t.thanks,
      },
    },
  ];
});
```

### Reusing the Order Parser Helpers

You rarely need to re-implement order data extraction. `@unchainedshop/platform` exports the helpers the built-in order mails use themselves:

```typescript
import { parser } from '@unchainedshop/platform';

// Full plain-text order summary (what the built-in confirmation mail contains):
const text = await parser.transformOrderToText({ order, locale: new Intl.Locale(locale) }, api);

// Or the structured data, for building your own HTML body:
const summary = await parser.getOrderSummaryData(order, { locale }, api);
// → { prices: { items, taxes, delivery, payment, gross }, rawPrices, payment,
//     delivery, deliveryAddress, billingAddress }
const positions = await parser.getOrderPositionsData(order, { locale }, api);
// → [{ productTexts, quantity, unitPrice, total, rawPrices, configuration }, ...]
```

Prices in `prices`/`unitPrice`/`total` are pre-formatted with `Intl.NumberFormat` in the given locale (e.g. `CHF 1'234.56` for `de-CH`, `1.234,56 EUR` for `de-DE`). Pass a `format` function to take over formatting entirely, and use `rawPrices` (`{ amount, currencyCode }` in minor units) when you need the numbers:

```typescript
const positions = await parser.getOrderPositionsData(
  order,
  {
    locale,
    format: ({ amount, currencyCode }) =>
      new Intl.NumberFormat('fr-CH', { style: 'currency', currency: currencyCode }).format(
        amount / 100,
      ),
  },
  api,
);
```

### Loading HTML Bodies from Files

If you prefer editing HTML/text bodies as files instead of template literals, resolve them relative to `import.meta.url` — that works both when running TypeScript sources directly in development and from the compiled output in a production image (a path relative to `process.cwd()` would break in one of the two):

```typescript
import { readFile } from 'node:fs/promises';

const loadBody = async (name: string) =>
  readFile(new URL(`./messages/${name}`, import.meta.url), 'utf8');

MessagingDirector.registerTemplate('ORDER_CONFIRMATION', async ({ orderId, locale }, api) => {
  const order = await api.modules.orders.findOrder({ orderId });
  const language = new Intl.Locale(locale).language;
  const summary = await parser.getOrderSummaryData(
    order,
    { locale: new Intl.Locale(locale) },
    api,
  );

  let html = await loadBody(`order-confirmation.${language}.html`);
  // Simple zero-dependency interpolation; bring your own engine if you need more
  html = html.replace(
    /{{\s*(\w+)\s*}}/g,
    (_, key) => ({ orderNumber: order.orderNumber, total: summary.prices.gross })[key] ?? '',
  );

  return [
    {
      type: 'EMAIL',
      input: {
        from: process.env.EMAIL_FROM,
        to: order.contact.emailAddress,
        subject: `Order ${order.orderNumber}`,
        text: await parser.transformOrderToText({ order, locale: new Intl.Locale(locale) }, api),
        html,
      },
    },
  ];
});
```

Ship the `messages/` folder alongside your compiled output (e.g. `cp -r src/messages lib/` in your build script, or mark it as an asset in your bundler).

Unchained deliberately ships no template engine — if you want richer templating (Mustache, MJML, ICU messages), install it in your project and call it inside your resolver.

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
import { OrderPricingSheet } from '@unchainedshop/core';

const orderAlert: TemplateResolver = async ({ orderId }, api) => {
  const order = await api.modules.orders.findOrder({ orderId });
  const total = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  }).total();

  return [
    {
      type: 'EMAIL',
      input: {
        to: 'admin@example.com',
        subject: `New order #${order.orderNumber}`,
        text: `Order total: ${total.amount} ${total.currencyCode}`,
      },
    },
    {
      type: 'TWILIO',
      input: {
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
