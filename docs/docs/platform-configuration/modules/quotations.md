---
sidebar_position: 8
title: Quotations Module
sidebar_label: Quotations
description: Quote request and proposal management
---

# Quotations Module

The quotations module manages quote requests and proposal workflows.

## Configuration Options

```typescript
export interface QuotationsSettingsOptions {
  quotationNumberHashFn?: (quotation: Quotation, index: number) => string;
}
```

### Quotation Number Creation

The `quotationNumberHashFn` is used to generate human-readable codes that can be easily spelled out to support staff. The default is a hashids based function that generates an alphanumeric uppercase string with length 6 without the hard to distinguish 0IOl etc. If the number has already been taken, the function gets iteratively called with an increasing `index`.

[Default Random Hash Generator](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/generate-random-hash.ts)

### Example Custom Configuration

```typescript
const options = {
  modules: {
    quotations: {
      quotationNumberHashFn: (quotation, index) => quotation.sequence + 300000 + index,
    },
  },
};
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `QUOTATION_REQUEST_CREATE` | `{ quotation }` | Emitted when a quotation request is created |
| `QUOTATION_UPDATE` | `{ quotation, field }` | Emitted when a quotation is updated |

## More Information

For API usage and detailed documentation, see the [core-quotations package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-quotations).
