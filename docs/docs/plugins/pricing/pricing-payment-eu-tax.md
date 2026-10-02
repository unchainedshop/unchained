---
sidebar_position: 39.1
title: Payment EU VAT
sidebar_label: EU VAT (Payment)
description: Apply destination-based EU VAT to payment fees
---

# Payment EU VAT

Applies destination-based EU VAT to payment fees (for example an invoice or card surcharge). A payment fee charged to the buyer is an incidental expense of the supply ([Art. 78(b) VAT Directive](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32006L0112): "incidental expenses, such as commission, packing, transport and insurance costs, charged by the supplier to the customer") and not a separate exempt payment service: the Court of Justice holds that a charge for paying in a particular way is part of the consideration for the main supply ([C-276/09 Everything Everywhere](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62009CJ0276)).

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PaymentEuTaxPlugin } from '@unchainedshop/plugins/pricing/payment-eu-tax';

pluginRegistry.register(PaymentEuTaxPlugin);
```

Or register all EU tax adapters (product, delivery and payment) via the country preset:

```typescript
import { registerEuTaxPlugins } from '@unchainedshop/plugins/presets/countries/eu';

registerEuTaxPlugins();
```

## How It Works

1. Resolves the destination country like [Product EU VAT](./pricing-product-eu-tax.md) (delivery address → billing address → order or request country)
2. Determines the tax category from the payment provider's `eu-tax-category` configuration entry, falling back to the destination country's **standard** rate
3. Resolves the rate valid at order time from the bundled per-country era tables, extracts it from gross fees and adds it to net fees

Payment fees of goods delivered outside of the EU stay untaxed, like the goods. The fee follows the rate of the main supply: a shop that only sells goods at a reduced rate sets that category on its payment providers; for orders mixing rates, the fee has to be split by the share of each rate, which needs a custom adapter.

Rate data and category semantics are shared with the [Product EU VAT](./pricing-product-eu-tax.md) adapter (bundled `eu-tax-rates.json`, era-based, EC-verified).

## Configuration

```graphql
mutation ConfigurePaymentProvider {
  updatePaymentProvider(
    paymentProviderId: "provider-id"
    paymentProvider: {
      configuration: [
        { key: "eu-tax-category", value: "reduced" }
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
| Key | `shop.unchained.pricing.payment-eu-tax` |
| Version | `1.0.0` |
| Order Index | `80` |
| Source | [pricing/payment-eu-tax/adapter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/payment-eu-tax/adapter.ts) |

## Related

- [Product EU VAT](./pricing-product-eu-tax.md) - EU VAT for products
- [Delivery EU VAT](./pricing-delivery-eu-tax.md) - EU VAT for delivery fees
- [Payment Swiss Tax](./pricing-payment-swiss-tax.md) - Swiss VAT for payment fees
