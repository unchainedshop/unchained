---
sidebar_position: 39.2
title: Payment UK VAT
sidebar_label: UK VAT (Payment)
description: Apply UK VAT to payment fees
---

# Payment UK VAT

Applies UK VAT rates to payment fees (for example an invoice or card surcharge). A payment fee charged to the buyer is further consideration for the goods, not a separate exempt payment service: the Upper Tribunal held that a card fee takes the VAT rate of the main supply ([SilverDoor v HMRC [2024] UKUT 147](https://assets.publishing.service.gov.uk/media/665054052eb55b89628fc459/Silverdoor_decision_14.04__102300994.2_.pdf), following the Court of Justice in C-276/09 Everything Everywhere).

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PaymentUkTaxPlugin } from '@unchainedshop/plugins/pricing/payment-uk-tax';

pluginRegistry.register(PaymentUkTaxPlugin);
```

Or register all UK tax adapters (product, delivery and payment) via the country preset:

```typescript
import { registerUkTaxPlugins } from '@unchainedshop/plugins/presets/countries/uk';

registerUkTaxPlugins();
```

## How It Works

1. Locates the supply like [Product UK VAT](./pricing-product-uk-tax.md): the delivery address, else the billing address, else the country of the order or request, in the UK VAT area (GB, IM)
2. Determines the tax category from the payment provider's `uk-tax-category` configuration entry, falling back to STANDARD (20%)
3. Resolves the rate valid at order time from the bundled era table, extracts it from gross fees and adds it to net fees

Payment fees of goods delivered outside of the UK VAT area stay untaxed, like the goods. The fee follows the rate of the main supply: a shop that only sells zero-rated goods (for example books) sets `zero` on its payment providers; for orders mixing rates, the fee has to be split by the share of each rate, which needs a custom adapter.

Rate data and category semantics are shared with the [Product UK VAT](./pricing-product-uk-tax.md) adapter (bundled `uk-tax-rates.json`, era-based, gov.uk-verified).

## Configuration

```graphql
mutation ConfigurePaymentProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "uk-tax-category", value: "standard" }
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
| Key | `shop.unchained.pricing.payment-uk-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/payment-uk-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/payment-uk-tax/adapter.ts) |

## Related

- [Product UK VAT](./pricing-product-uk-tax.md) - UK VAT for products
- [Delivery UK VAT](./pricing-delivery-uk-tax.md) - UK VAT for delivery fees
- [Payment Swiss Tax](./pricing-payment-swiss-tax.md) - Swiss VAT for payment fees
