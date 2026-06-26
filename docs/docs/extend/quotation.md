---
sidebar_position: 9
sidebar_label: Quotations
title: Quotations
description: Customizing quotation
---

# Quotation Adapters

Accept and process quotation (request-for-quote) requests for shop items, manually or automatically. Several adapters can be active; they run in ascending `orderIndex`.

## Creating an adapter

Use the [`registerQuotation`](./plugin-factories.md#quotations) factory. Only `adapterId` is required — every callback has a sensible default. The example below requires manual verification and proposal, and expires a request after an hour if no quote is given.

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
| `quote(context)` | produce the offer (a `QuotationProposal`) |
| `transformItemConfiguration(params, context)` | normalize the submitted request JSON into a structured item configuration |
| `isManualRequestVerificationRequired` | a request must be verified by a human before it is valid (boolean) |
| `isManualProposalRequired` | the quote is created manually rather than automatically (boolean) |
| `submitRequest` / `verifyRequest` / `rejectRequest` | lifecycle hooks returning a boolean for the corresponding transition |

> For full control of every `IQuotationAdapter` method, build the adapter directly and register it via `pluginRegistry.register()` — see [Plugin System](../concepts/director-adapter-pattern.md#adapter-contracts).

## Related

- [Plugin Factories](./plugin-factories.md#quotations) — `registerQuotation`
- [Manual quotation plugin](../plugins/quotations/quotation-manual) — the shipped adapter
