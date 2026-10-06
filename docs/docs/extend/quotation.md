---
sidebar_position: 9
sidebar_label: Quotations
title: Quotations
description: Customizing quotation
---

# Quotation Adapters

Accept and process quotation (request-for-quote) requests for shop items, manually or automatically. Several adapters can be registered; the first adapter that activates for a quotation handles it.

## Creating an adapter

Use the [`registerQuotation`](./plugin-factories.md#quotations) factory. Only `adapterId` is required — every callback has a sensible default. The example below requires manual verification and proposal. When the proposal is submitted, `quote` sets its expiry to one hour later.

```typescript
import { registerQuotation } from '@unchainedshop/core';

registerQuotation({
  adapterId: 'manual',
  isManualRequestVerificationRequired: true,
  isManualProposalRequired: true,
  quote: async (context) => ({
    expires: new Date(Date.now() + 3600 * 1000),
  }),
  transformItemConfiguration: async (params, context) => ({
    quantity: params.quantity,
    configuration: params.configuration,
  }),
});
```

## Callback reference

| Option | Description |
|---|---|
| `quote(context)` | produce the offer (a `QuotationProposal`: `price`, `quantity`, `isTaxable`, `isNetPrice`, `expires`, `meta`). Set `isTaxable` / `isNetPrice` with the price so it is clear whether the quote is net or gross |
| `transformItemConfiguration(params, context)` | normalize the submitted request JSON into a structured item configuration |
| `isManualRequestVerificationRequired` | a request must be verified by a human before it is valid (boolean) |
| `isManualProposalRequired` | the quote is created manually rather than automatically (boolean) |
| `submitRequest` / `verifyRequest` / `rejectRequest` | lifecycle hooks returning a boolean for the corresponding transition |

## Quotations in the cart

`addCartQuotation` turns a proposed quotation into a cart position:

- The position carries the `quotationId` and is priced by the [Product Quotation Price](../plugins/pricing/pricing-product-quotation-price.md) plugin at the proposed unit price (`quotation.price`), taxed as the proposal states (`isTaxable` / `isNetPrice` from `quote()`), as long as the proposal is valid
- A quotation quotes a quantity: `requestQuotation(productId, quantity)` stores the requested one, and the proposal may change it (`quantity` in the proposal of `quote()`). `addCartQuotation` without `quantity` adds the quoted quantity; adding the quotation again adds to its line
- `transformItemConfiguration` decides the total quantity and the configuration of the quotation's line: `addCartQuotation` passes the line's quantity after adding (existing + added), `updateCartItem` the new quantity, and the line takes what it returns. Without a custom `transformItemConfiguration`, the line keeps the configuration of the quotation, whatever configuration the buyer sends, and takes multiples of the quoted quantity (a quotation for 100 can be ordered as 200), never less: other quantities fail with `QuotationItemConfigurationError`. A quotation without a quantity takes any quantity. To allow no quantity change, return the quoted quantity (or `null` to reject):

  ```typescript
  registerQuotation({
    adapterId: 'fixed-quantity',
    transformItemConfiguration: async ({ configuration }, { quotation }) => ({
      quantity: quotation.quantity,
      configuration,
    }),
  });
  ```
- `validateOrderPosition` runs for the position, as for `addCartProduct`
- Only the owner's cart in the quotation's currency takes the quotation (`QuotationInvalidError` otherwise); a guest's open quotations move to the user on login, like the cart
- A quotation position never merges with a position of the same product added with `addCartProduct`
- An order reserves its quotation once it is checked out: while the order is pending, another cart cannot add it or check it out (`QuotationInvalidError`). Confirming the order fulfils the quotation, rejecting it releases the quotation again. Checkout locks the order's quotations (for up to 60 seconds) and checks them again before payment is charged, so two carts checking out at the same time cannot both order it

## Adapter order

The first activated adapter in ascending `orderIndex` handles a quotation. The shipped manual adapter runs at `0`; pass `orderIndex: -100` to `registerQuotation` to take precedence over it.

> For full control of every `IQuotationAdapter` method, build the adapter directly and register it via `pluginRegistry.register()` — see [Plugin System](../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Plugin Factories](./plugin-factories.md#quotations) — `registerQuotation`
- [Manual quotation plugin](../plugins/quotations/quotation-manual) — the shipped adapter
