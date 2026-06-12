---
sidebar_position: 3
sidebar_label: Plugin Factories
title: Plugin Registration Factories
description: Author custom adapters with one typed registerX() call
---

# Plugin Registration Factories

Unchained ships a set of **`registerX(...)` factory functions** — the recommended way to add a custom payment provider, pricing rule, discount, delivery method, worker, filter, file backend, quotation or enrollment adapter. Each factory takes a small typed options object, builds the underlying [`IPlugin`](../concepts/director-adapter-pattern.md) for you, and registers it with the plugin registry in a single call.

All factories are exported from `@unchainedshop/core`:

```ts
import { registerPaymentProvider, registerProductPricing } from '@unchainedshop/core';
```

:::tip Three ways to register a plugin
1. **Presets** — `registerBasePlugins()` / `registerAllPlugins()` for the built-in plugins (see [Plugin Presets](../platform-configuration/plugin-presets.md)).
2. **`registerX(...)` factories** — *recommended* for your own custom adapters (this page).
3. **Hand-built `IPlugin` + `pluginRegistry.register()`** — the low-level escape hatch (see [When not to use a factory](#when-not-to-use-a-factory)).

Call factories **before `startPlatform()`**, in your boot code.
:::

## Two things every factory does for you

- **Keys are auto-namespaced.** You pass an `adapterId` (a short, stable string), and the factory derives the plugin/adapter key as `shop.unchained.<domain>.<adapterId>`. Re-using the same `adapterId` is dedupe-safe (the registry ignores a duplicate key and warns). Pick a stable id; don't generate a random one per boot.
- **The version is fixed at `1.0.0`.** If you need to control the `key`, `version`, attach HTTP `routes`, a `module`, or `onRegister`/`onShutdown` lifecycle hooks, build an `IPlugin` by hand instead — see [below](#when-not-to-use-a-factory).

:::note Parameter naming varies per factory
Because each director exposes a different adapter contract, the option names differ between factories (e.g. payment uses `isActive`, delivery uses `active`). The tables below are authoritative per factory.
:::

Many behavior options accept **either a literal value or a function** — e.g. `charge`, `send`, `stock`. Pass a constant for static behavior, or a `(configuration, context) => Promise<...>` callback for dynamic behavior.

---

## Payment

### `registerPaymentProvider`

A generic payment provider for any gateway.

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.payment.<adapterId>` |
| `charge` | `false \| (config, context) => Promise<PaymentChargeActionResult \| false>` | ✅ | `false`/return-`false` = not yet paid; return `{ transactionId }` = paid; throw = abort checkout |
| `type` | `PaymentProviderType` | | `GENERIC` (default), `CARD`, `INVOICE` |
| `sign` | `(config, context) => Promise<string \| null>` | | sign a client-side payment intent |
| `validate` | `(config, context) => Promise<boolean>` | | validate a stored credential |
| `isActive` | `boolean` | | default `true` |
| `isPayLaterAllowed` | `boolean` | | default `false` |
| `configurationError` | `PaymentError \| null` | | surface a misconfiguration |
| `cancel` / `confirm` | `(config, context) => Promise<boolean>` | | refund / capture |

```ts
import { registerPaymentProvider } from '@unchainedshop/core';

registerPaymentProvider({
  adapterId: 'acme-gateway',
  isActive: true,
  charge: async (configuration, context) => {
    const receipt = await acme.charge(context.order, context.paymentContext);
    return { transactionId: receipt.id };
  },
});
```

### `registerInvoicePayment`

A pay-by-invoice provider (`PaymentProviderType.INVOICE`).

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.payment.invoice-<adapterId>` |
| `charge` | `false \| (config, context) => Promise<…>` | ✅ | usually `false` (collected out of band) |
| `active` | `boolean` | | default `true` |
| `payLaterAllowed` | `boolean` | | default `false` |

> See also: [Payment plugins](./order-fulfilment/fulfilment-plugins/payment.md)

---

## Delivery

### `registerDeliveryProvider`

A generic delivery provider; choose the `type`.

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.delivery.<adapterId>` |
| `send` | `boolean \| (config, context) => Promise<boolean \| Work>` | ✅ | trigger fulfilment; return a `Work` item to defer to the work queue |
| `type` | `DeliveryProviderType` | | `SHIPPING` (default), `PICKUP` |
| `active` | `boolean` | | default `true` |
| `autoReleaseAllowed` | `boolean` | | default `true` |
| `estimatedDeliveryThroughput` | `(warehousingThroughputTime, context) => Promise<number \| null>` | | ms estimate |

```ts
import { registerDeliveryProvider } from '@unchainedshop/core';

registerDeliveryProvider({
  adapterId: 'acme-express',
  send: async (configuration, context) => {
    await acme.createShipment(context.order);
    return true;
  },
});
```

### `registerShippingDelivery` / `registerPickUpDelivery`

Convenience specializations of the above for `SHIPPING` and `PICKUP`. `registerPickUpDelivery` additionally takes:

| Option | Type | Required | Notes |
|---|---|---|---|
| `locations` | `DeliveryLocation[] \| (context) => Promise<DeliveryLocation[]>` | ✅ | available pickup points |

> See also: [Delivery plugins](./order-fulfilment/fulfilment-plugins/delivery.md)

---

## Warehousing

### `registerPhysicalWarehousing`

Stock and timing for physical goods.

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.warehousing.physical.<adapterId>` |
| `stock` | `number \| (referenceDate, config, context) => Promise<number>` | | available quantity |
| `productionTime` | `number \| (qty, config, context) => Promise<number>` | | ms (made-to-order) |
| `commissioningTime` | `number \| (qty, config, context) => Promise<number>` | | ms to prepare |
| `orderIndex` | `number` | | default `0` |

### `registerVirtualWarehousing`

Tokenized / NFT products. `tokenize` is required.

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.warehousing.virtual.<adapterId>` |
| `tokenize` | `(config, context) => Promise<TokenSurrogate[]>` | ✅ | mint tokens for a checked-out position |
| `stock` | `number \| fn` | | |
| `tokenMetadata` | `(serial, date, config, context) => Promise<Metadata>` | | ERC metadata |
| `isInvalidateable` | `(serial, date, config, context) => Promise<boolean>` | | |
| `orderIndex` | `number` | | default `0` |

> See also: [Warehousing plugins](./order-fulfilment/fulfilment-plugins/warehousing.md)

---

## Pricing

The four pricing factories share the **same signature**: `{ adapterId, orderIndex?, isActivatedFor?, calculate }`.

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.pricing.<domain>-<adapterId>` |
| `calculate` | `(sheet, context) => Promise<void>` | ✅ | push rows onto `sheet`; the factory continues the chain for you |
| `isActivatedFor` | `(context) => boolean` | | default `true` |
| `orderIndex` | `number` | | chain order, default `0` |

:::warning Do not call the base `calculate()` yourself
The factory wraps your `calculate` and continues the pricing chain automatically. Just push rows onto the `sheet` — **do not** call `super.calculate()` / `pricingAdapter.calculate()` (that was the old class-based API).
:::

- **`registerProductPricing`** — per-product price (`sheet.addItem({ amount, isTaxable, isNetPrice, meta })`)
- **`registerOrderPricing`** — order totals (`sheet.addItems(...)`)
- **`registerPaymentPricing`** — payment fees (`sheet.addFee(...)`)
- **`registerDeliveryPricing`** — delivery fees (`sheet.addFee(...)`)

```ts
import { registerProductPricing } from '@unchainedshop/core';

registerProductPricing({
  adapterId: 'member-surcharge',
  isActivatedFor: (context) => Boolean(context.product?.tags?.includes('exclusive')),
  calculate: async (sheet, context) => {
    sheet.addItem({ amount: 500, isTaxable: true, isNetPrice: true, meta: { adapter: 'member-surcharge' } });
  },
});
```

> See also: [Product pricing](./pricing/product-pricing.md), [Delivery pricing](./pricing/delivery-pricing.md), [Payment pricing](./pricing/payment-pricing.md)

---

## Discounts

### `registerProductDiscount` / `registerOrderDiscount`

`discountForPricingAdapterKey` is the core hook (return a discount configuration, or `null` to not discount).

| Option | Type | Required | Notes |
|---|---|---|---|
| `adapterId` | `string` | ✅ | key `shop.unchained.discount.<product\|order>-<adapterId>` |
| `discountForPricingAdapterKey` | `(params, context?) => DiscountConfiguration \| null` | ✅ | maps a discount to a pricing row |
| `isValidForSystemTriggering` | `() => Promise<boolean>` | | auto-apply without a code |
| `isValidForCodeTriggering` | `(code/context) => Promise<boolean>` | | apply for a coupon code |
| `reserve` / `release` | `fn` | | reserve/return coupon capacity |
| `orderIndex` *(product only)* | `number` | | |
| `isManualAdditionAllowed` / `isManualRemovalAllowed` *(product only)* | `fn` | | manual coupon entry |

```ts
import { registerOrderDiscount } from '@unchainedshop/core';

registerOrderDiscount({
  adapterId: 'promo10',
  isValidForCodeTriggering: async (code) => code === 'PROMO10',
  discountForPricingAdapterKey: ({ pricingAdapterKey }) =>
    pricingAdapterKey === 'shop.unchained.pricing.order-items' ? { rate: 0.1 } : null,
});
```

> See also: [Order discounts](./pricing/order-discounts.md)

---

## Filters & Search

| Factory | Required callback | Notes |
|---|---|---|
| `registerProductSearchFilter` | `search(params) => Promise<string[]>` | external product search (e.g. Algolia); `adapterId` optional |
| `registerAssortmentSearchFilter` | `search(params) => Promise<string[]>` | external assortment search; `adapterId` optional |
| `registerProductDiscoverabilityFilter` | — | hides products tagged `hiddenTagValue` (default `'hidden'`) from search |

`search` receives `SearchQuery & { queryString, locale }` and returns matching ids. All three accept an optional `adapterId` (auto-generated if omitted) and `orderIndex`.

```ts
import { registerProductSearchFilter } from '@unchainedshop/core';

registerProductSearchFilter({
  adapterId: 'algolia',
  search: async ({ queryString, locale }) => algolia.search(queryString, locale.baseName),
});
```

> See also: [Filters](./catalog/filter.md)

---

## Workers

### `registerWorker`

A background job type. **Keyed by `type`** — there is no `adapterId`.

| Option | Type | Required | Notes |
|---|---|---|---|
| `type` | `string` | ✅ | work type; key `shop.unchained.worker.<type>` |
| `process` | `(input, workId) => Promise<Result>` | | your job logic; a thrown error becomes `{ success: false }` |
| `external` | `boolean` | | default `false` |
| `maxParallelAllocations` | `number` | | concurrency cap |

```ts
import { registerWorker } from '@unchainedshop/core';

registerWorker<{ email: string }, { messageId: string }>({
  type: 'SEND_WELCOME',
  process: async (input) => ({ messageId: await mailer.send(input.email) }),
});
```

> See also: [Work Queue](./worker.md)

---

## Files

### `registerFileAdapter`

A storage backend (S3, etc.). `createSignedURL` and `uploadFileFromStream` are required.

| Option | Type | Required |
|---|---|---|
| `adapterId` | `string` | ✅ |
| `createSignedURL` | `(directoryName, fileName, api) => Promise<{ putURL, … } \| null>` | ✅ |
| `uploadFileFromStream` | `(directoryName, rawFile, api, options?) => Promise<UploadFileData>` | ✅ |
| `createDownloadURL` | `(file, expiry?) => Promise<string \| null>` | |
| `removeFiles` | `(files, api) => Promise<void>` | |
| `uploadFileFromURL` | `(directoryName, fileInput, api) => Promise<UploadFileData>` | |

> The active file backend is the **first registered** file adapter — register exactly one (the base preset registers GridFS). See [File plugins](../plugins/files/index.md).

---

## Quotations

### `registerQuotation`

All callbacks are optional (the base adapter provides working defaults); only `adapterId` is required.

| Option | Type | Notes |
|---|---|---|
| `adapterId` | `string` | required |
| `quote` | `(context) => Promise<QuotationProposal>` | produce the offer |
| `transformItemConfiguration` | `(params, context) => Promise<QuotationItemConfiguration \| null>` | map the requested config to an order item |
| `isManualProposalRequired` / `isManualRequestVerificationRequired` | `boolean` | |
| `submitRequest` / `verifyRequest` / `rejectRequest` | `(context) => Promise<boolean>` | lifecycle hooks |

> See also: [Quotation](./quotation.md)

---

## Enrollments

### `registerEnrollment`

Recurring/subscription plans. `configurationForOrder` is required.

| Option | Type | Notes |
|---|---|---|
| `adapterId` | `string` | required |
| `configurationForOrder` | `(params, context) => Promise<{ orderPositionTemplates, orderContext? } \| null>` | builds the recurring order |
| `isActivatedFor` | `(productPlan?) => boolean` | gate by plan; default `true` |
| `transformOrderItem` | `(orderPosition, api) => Promise<EnrollmentPlan>` | |
| `nextPeriod` | `(context) => Promise<EnrollmentPeriod \| null>` | next billing window |
| `isOverdue` / `isValidForActivation` | `(context) => Promise<boolean>` | |

> See also: [Enrollment](./enrollment.md)

---

## When not to use a factory

Reach for a hand-built [`IPlugin`](../concepts/director-adapter-pattern.md) + `pluginRegistry.register()` when you need:

- a custom `key` or `version` (factories fix the namespace and `1.0.0`);
- HTTP `routes` (a webhook), a DB-backed `module`, or `onRegister`/`onShutdown` lifecycle hooks;
- more than one adapter in a single plugin;
- behavior a factory doesn't expose.

```ts
import { pluginRegistry, type IPlugin } from '@unchainedshop/core';

const MyPlugin: IPlugin = {
  key: 'com.acme.payment.gateway',
  label: 'Acme Gateway',
  version: '2.1.0',
  adapters: [AcmeAdapter],
  routes: [{ path: '/payment/acme/webhook', method: 'POST', handler: acmeWebhook }],
  onRegister: () => {
    if (!process.env.ACME_SECRET) throw new Error('ACME_SECRET not set');
  },
};

pluginRegistry.register(MyPlugin);
```
