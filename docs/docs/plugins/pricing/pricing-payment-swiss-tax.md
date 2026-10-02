---
sidebar_position: 39
title: Payment Swiss Tax
sidebar_label: Swiss Tax (Payment)
description: Apply Swiss VAT to payment fees
---

# Payment Swiss Tax

Applies Swiss VAT rates to payment fees (for example an invoice or card surcharge). A payment fee charged to the buyer is part of the consideration for the supply ([Art. 24 para. 1 MWSTG](https://www.fedlex.admin.ch/eli/cc/2009/615/de#art_24): "including the reimbursement of all costs, even if they are invoiced separately") and, as an ancillary supply, shares the tax treatment of the goods (Art. 19 para. 4 MWSTG). It is not an exempt financial service: the shop recovers its own costs, it does not provide a payment service.

:::info Included in All Preset
Registered automatically by `registerAllPlugins()` (via `registerSwissTaxPlugins()` from `@unchainedshop/plugins/presets/countries/ch`).
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PaymentSwissTaxPlugin } from '@unchainedshop/plugins/pricing/payment-swiss-tax';

pluginRegistry.register(PaymentSwissTaxPlugin);
```

## How It Works

1. Locates the supply like [Product Swiss Tax](./pricing-product-swiss-tax.md): the delivery address, else the billing address, else the country of the order or request
2. Resolves the tax category from the payment provider configuration
3. Falls back to the DEFAULT rate (8.1%) if not specified
4. Extracts the tax from gross fees, adds it to net fees

Payment fees of goods delivered outside of Switzerland and Liechtenstein stay untaxed, like the goods.

## Tax Categories

| Category | 2024+ | 2018–2023 | 2011–2017 | 2001–2010 |
|----------|-------|-----------|-----------|-----------|
| DEFAULT | 8.1% | 7.7% | 8.0% | 7.6% |
| REDUCED | 2.6% | 2.5% | 2.5% | 2.4% |
| SPECIAL | 3.8% | 3.7% | 3.8% | 3.6% |

Rate data is shared with the [Product Swiss Tax](./pricing-product-swiss-tax.md) adapter (bundled `ch-tax-rates.json`, era-based, ESTV-verified; the rate follows the order date).

The fee follows the rate of the main supply. A shop that only sells goods at the reduced rate (for example food) sets `reduced` on its payment providers; for orders mixing rates, the ESTV expects the fee to be split by the share of each rate, which needs a custom adapter.

## Configuration

Set the tax category on the payment provider:

```graphql
mutation ConfigurePaymentProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "swiss-tax-category", value: "default" }
      ]
    }
  ) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.payment-swiss-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/payment-swiss-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/payment-swiss-tax/adapter.ts) |

## Related

- [Delivery Swiss Tax](./pricing-delivery-swiss-tax.md) - Swiss VAT for delivery fees
- [Product Swiss Tax](./pricing-product-swiss-tax.md) - Swiss VAT for products
- [Free Payment](./pricing-payment-free.md) - Zero-cost payment
- [Payment Pricing](../../extend/pricing/payment-pricing.md) - Custom payment fees
