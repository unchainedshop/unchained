---
sidebar_position: 5
sidebar_label: Filter
title: Filter
description: Customize filter and search
---

# Custom Filter Plugins

Filter adapters transform search selectors, sorting, and matching IDs. `FilterDirector` runs them in ascending `orderIndex` order, passing previous results to subsequent adapters. Give every adapter a unique key.

Compose your adapter from `FilterAdapter`, implement the actions you need, and register it with `FilterDirector`. The adapter, director, and their interfaces are exported by `@unchainedshop/core`.

```typescript
import { FilterAdapter, FilterDirector, type IFilterAdapter } from '@unchainedshop/core';

const ShopAttributeFilter: IFilterAdapter = {
  ...FilterAdapter,
  key: 'ch.shop.filter',
  label: 'Filter products by custom metadata attributes',
  version: '1.0.0',
  orderIndex: 10,

  actions(params) {
    return {
      ...FilterAdapter.actions(params),
      async transformProductSelector(query, { key, value } = {}) {
        if (!key) return query;
        return {
          $and: [
            query,
            {
              'meta.attributes': {
                $elemMatch: {
                  key,
                  value: value !== undefined ? value : { $exists: true },
                },
              },
            },
          ],
        };
      },
    };
  },
};

FilterDirector.registerAdapter(ShopAttributeFilter);
```

This example assumes your application stores `{ key, value }` entries in `product.meta.attributes`. It preserves the incoming selector, including status and assortment restrictions. Import the adapter before starting the platform.

## Available Actions

| Action | Purpose |
|--------|---------|
| `transformFilterSelector(query, options)` | Changes which filters are available for a search |
| `transformProductSelector(query, options)` | Adds or changes product search restrictions |
| `transformSortStage(sort, options)` | Changes the requested MongoDB sort |
| `searchProducts({ productIds }, options)` | Resolves or narrows product IDs |
| `searchAssortments({ assortmentIds }, options)` | Resolves or narrows assortment IDs |
| `aggregateProductIds({ productIds })` | Combines the matched product IDs |

Selector transformations and search actions return promises. `aggregateProductIds` returns an array synchronously. Search actions may return `undefined` when they do not supply an ID restriction; an empty array means there are no matches.

`actions` receives the filter and search query together with `modules`. Spread `FilterAdapter.actions(params)` to retain the default implementation for actions you do not override.

## Related

- [Search Behavior](./search-behavior.md)
- [Search and Filtering](../../guides/search-and-filtering.md)
