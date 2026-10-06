---
sidebar_position: 31
title: Product Quotation Price
sidebar_label: Product Quotation Price
description: Price cart positions of accepted quotations at the proposed unit price
---

# Product Quotation Price

Prices a cart position that was added with `addCartQuotation` at the unit price proposed in its quotation (`quotation.price`) instead of the catalog price. Discounts and taxes apply on top of the quoted price.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ProductQuotationPricePlugin } from '@unchainedshop/plugins/pricing/product-quotation-price';

pluginRegistry.register(ProductQuotationPricePlugin);
```

## How It Works

1. Activates only for positions that carry a `quotationId`
2. Applies the quoted price only if the quotation is a valid proposal (`PROPOSED` and not expired), is for the same product and currency, and belongs to the cart owner. Otherwise the cart shows the catalog price, and checkout fails with `QuotationInvalidError` instead of charging it
3. Replaces the catalog price rows with `quotation.price × quantity`, taxed as the proposal states (`quotation.isTaxable` / `quotation.isNetPrice`). A quotation proposed without these flags counts as a taxable gross price, however the catalog price is taxed

The proposed price is set by the quotation adapter's `quote()`; the [manual quotation plugin](../quotations/quotation-manual) reads it from the proposal context, e.g. `makeQuotationProposal(quotationId, { price: 8500, isNetPrice: true })`. A net price gets VAT added on top, a gross price includes it.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.product-quotation-price` |
| Version | `1.0.0` |
| Order Index | `1` |
| Source | [pricing/product-quotation-price](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/pricing/product-quotation-price) |

## Related

- [Product Catalog Price](./pricing-product-catalog-price.md) - Base product pricing
- [Quotations](../../extend/quotation.md) - Quotation adapters
