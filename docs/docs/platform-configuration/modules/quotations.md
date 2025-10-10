---
sidebar_position: 8
title: Quotations Options
sidebar_label: Quotations
---

```typescript
export interface QuotationsSettingsOptions {
  quotationNumberHashFn?: (quotation: Quotation, index: number) => string;
}
```

### Quotation Number Creation

The `quotationNumberHashFn` is used to generate human-readble codes that can be easily spelled out to support staff. The default is a hashids based function that generates an alphanumeric uppercase string with length 6 without the hard to distinguish 0IOl etc. If the number has already been taken, the function gets iteratively called with an increasing `index`.

[Default Random Hash Generator](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/generate-random-hash.ts)


### Example custom configuration:

```typescript
const options = {
  modules: {
    quotations: {
      quotationNumberHashFn: (enrollment, try) => (enrollment.sequence + 300000 + try)
    },
  }
};
```
