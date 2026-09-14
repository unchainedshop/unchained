---
sidebar_position: 9
sidebar_label: Quotations
title: Quotations
description: Customizing quotation
---

# Quotation Adapters

Quotation adapters process quote requests. Register an object implementing `IQuotationAdapter` with `QuotationDirector`. The adapter types and director are exported by `@unchainedshop/core`; quotation record types remain in `@unchainedshop/core-quotations`.

Adapters are evaluated in ascending `orderIndex` order. Use `isActivatedFor` to select the requests your adapter handles.

## Manual Quotation Example

```typescript
import { QuotationAdapter, QuotationDirector, type IQuotationAdapter } from '@unchainedshop/core';

const ManualOffering: IQuotationAdapter = {
  ...QuotationAdapter,
  key: 'my-shop.quotations.manual',
  label: 'Manual quotation',
  version: '1.0.0',
  orderIndex: 1,

  isActivatedFor: () => true,

  actions(params) {
    return {
      ...QuotationAdapter.actions(params),
      configurationError: () => null,
      isManualRequestVerificationRequired: async () => true,
      isManualProposalRequired: async () => true,
      quote: async () => ({
        expires: new Date(Date.now() + 60 * 60 * 1000),
      }),
    };
  },
};

QuotationDirector.registerAdapter(ManualOffering);
```

The example requires manual verification and proposal. When the proposal is created, `quote()` sets its expiry to one hour from that moment. It does not start an expiry timer when the original request is submitted.

## Actions

| Action | Purpose |
|--------|---------|
| `configurationError()` | Returns an error or `null` |
| `isManualRequestVerificationRequired()` | Determines whether requests need manual verification |
| `isManualProposalRequired()` | Determines whether a proposal must be created manually |
| `quote()` | Returns proposal data such as price and expiry |
| `submitRequest()` | Accepts or rejects submission |
| `verifyRequest()` | Accepts or rejects verification |
| `rejectRequest()` | Allows request rejection |
| `transformItemConfiguration(params)` | Normalizes quantity and product configuration |

Spread `QuotationAdapter.actions(params)` to retain default actions you do not override. Import your adapter before starting the platform.
