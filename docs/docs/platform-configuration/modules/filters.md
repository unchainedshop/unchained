---
sidebar_position: 5
title: Filters Module
sidebar_label: Filters
description: Product filtering and faceted search configuration
---

# Filters Module

The filters module manages product filtering and faceted search capabilities.

## Configuration Options

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

:::warning
If you customize `setCachedProductIds`, ensure you also customize `getCachedProductIds`.
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `FILTER_CREATE` | `{ filter }` | Emitted when a filter is created |
| `FILTER_UPDATE` | `{ filterId, options, updated }` | Emitted when a filter is updated |
| `FILTER_REMOVE` | `{ filterId }` | Emitted when a filter is removed |
| `FILTER_UPDATE_TEXT` | `{ filterId, locale }` | Emitted when filter text is updated |

## More Information

For API usage and detailed documentation, see the [core-filters package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-filters).
