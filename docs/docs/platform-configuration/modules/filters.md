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
  purgeCachedProductIds?: (filterId: string) => Promise<void>;
}
```

### Cache contract

`purgeCachedProductIds` drops a filter's cache outright and is called when the filter is
deleted.

The default MongoDB implementation additionally retires cached values that are no longer options
of the filter, by re-reading the filter as it writes. Without that, an option that was renamed or
removed keeps answering with the product ids it held at the moment it disappeared.

:::caution
`setCachedProductIds` receives only the values it should store, so a custom backend cannot tell
which cached values have since been retired. Custom backends therefore keep the old behaviour and
need their own mechanism for dropping obsolete values — see
[#722](https://github.com/unchainedshop/unchained/issues/722).
:::

### Default Caching Implementation

- [mongodb](https://github.com/unchainedshop/unchained/blob/master/packages/core-filters/src/product-cache/mongodb.ts)

:::warning
Customize all three together. They fall back to the MongoDB implementation individually, so
overriding only some of them leaves you reading from one backend and writing to another.
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
