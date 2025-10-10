---
sidebar_position: 5
title: Filters Options
sidebar_label: Filters
---

```typescript
export interface FilterSettingsOptions {
  setCachedProductIds?: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[string[], Record<string, string[]>] | null>;
}
```

### Default Caching Implementation

- [mongodb](https://github.com/unchainedshop/unchained/blob/master/packages/core-filters/src/product-cache/mongodb.ts)
