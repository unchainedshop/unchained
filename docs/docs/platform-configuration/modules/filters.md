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
export type FiltersSettingsOptions = {
  setCachedProductIds?: (
    filterId: string,
    productIds: string[],
    productIdsMap: Record<string, string[]>,
    computedAt: number,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[string[], Record<string, string[]>] | null>;
  purgeCachedProductIds?: (filterId: string) => Promise<void>;
};
```

### Cache contract

`setCachedProductIds` **replaces** a filter's cache rather than adding to it. `productIdsMap` is
the complete set of values the filter can be queried by, so an implementation must retire keys it
does not mention — otherwise an option that was renamed or removed keeps answering with the
product ids it held when it disappeared.

`computedAt` is the filter generation the map was built from, taken from the filter's own
`updated` timestamp. Rebuilding scans the catalog once per option, so on a large catalog a
rebuild can be overtaken while it runs. **An implementation must not let an older generation
overwrite or retire what a newer one has already written.** Skipping that turns a stale row into
a missing one: an option added during the rebuild is retired again and silently resolves to
nothing, with no later rebuild to restore it.

Storing `computedAt` alongside each cached value and comparing before writing or deleting is
enough. A generation moving without the cache actually changing is harmless — it costs a skipped
write, and whatever moved it queues an invalidation anyway.

`purgeCachedProductIds` drops a filter's cache outright and is called when the filter is
deleted.

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
| `FILTER_UPDATE_TEXT` | `{ filterId, filterOptionValue, text }` | Emitted when filter text is updated |

## More Information

For API usage and detailed documentation, see the [core-filters package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-filters).
