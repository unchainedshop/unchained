---
sidebar_position: 5
sidebar_label: Filter
title: Filter
description: Customize filter and search
---

# Custom Filter Plugins

Filter adapters let you customize catalog search, filter visibility, MongoDB selectors, and sort behavior. Multiple filters can be active; they run in ascending `orderIndex`, and each filter receives the selector or result set produced by earlier filters.

## External Search

Use the search factories when an external engine such as Algolia, Meilisearch, or Elasticsearch should decide the matching ids. The factory builds the adapter and registers it immediately.

```typescript
import { registerProductSearchFilter } from '@unchainedshop/core';

registerProductSearchFilter({
  adapterId: 'elasticsearch',
  orderIndex: 5,
  search: async ({ queryString, locale }) => {
    const results = await elasticsearch.search({
      index: 'products',
      body: buildProductQuery(queryString, locale),
    });

    return results.hits.hits.map((hit) => hit._id);
  },
});
```

For assortment search, use `registerAssortmentSearchFilter` with the same callback shape:

```typescript
import { registerAssortmentSearchFilter } from '@unchainedshop/core';

registerAssortmentSearchFilter({
  adapterId: 'elasticsearch',
  search: async ({ queryString, locale }) => {
    const results = await elasticsearch.search({
      index: 'assortments',
      body: buildAssortmentQuery(queryString, locale),
    });

    return results.hits.hits.map((hit) => hit._id);
  },
});
```

`adapterId` is optional for filter factories. If you pass one, the plugin key is stable and duplicate registrations dedupe. If you omit it, Unchained generates a unique key so several instances of the same filter type can run side by side.

## Hide Products From Search

Use `registerProductDiscoverabilityFilter` to hide products with a tag from regular search results:

```typescript
import { registerProductDiscoverabilityFilter } from '@unchainedshop/core';

registerProductDiscoverabilityFilter({
  adapterId: 'hide-internal-products',
  hiddenTagValue: 'internal',
});
```

Register several discoverability filters when different tag conventions should all hide products.

## Custom Selector Logic

Use a hand-written adapter only when you need behavior the factories do not expose, such as changing MongoDB selectors or sort stages. Spread `FilterAdapter`, override the specific methods, then register the resulting plugin.

```typescript
import { FilterAdapter, pluginRegistry, type IFilterAdapter } from '@unchainedshop/core';

const ShopAttributeFilter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'ch.shop.filter.attributes',
  label: 'Shop attribute filter',
  version: '1.0.0',
  orderIndex: 10,

  actions: (params) => ({
    ...FilterAdapter.actions(params),

    async transformProductSelector(selector, options) {
      const { key, value } = options || {};
      if (!key) return selector;

      return {
        ...selector,
        status: 'ACTIVE',
        'shop.attributes': {
          $elemMatch: {
            key,
            value: value !== undefined ? value : { $exists: true },
          },
        },
      };
    },

    async transformSortStage(sort) {
      return { ...sort, created: -1 };
    },
  }),
};

pluginRegistry.register({
  key: ShopAttributeFilter.key,
  label: ShopAttributeFilter.label,
  version: ShopAttributeFilter.version,
  adapters: [ShopAttributeFilter],
});
```

## Callback Reference

| Method | Purpose |
|---|---|
| `transformFilterSelector(selector, options)` | changes which filter definitions are available for the current search |
| `transformProductSelector(selector, options)` | changes the MongoDB product selector |
| `transformSortStage(sort, options)` | changes the MongoDB sort stage |
| `searchProducts({ productIds }, options)` | narrows or replaces matching product ids |
| `searchAssortments({ assortmentIds }, options)` | narrows or replaces matching assortment ids |
| `aggregateProductIds(params)` | post-processes the final product id set |

## Related

- [Plugin Factories](../plugin-factories.md#filters--search) - search and discoverability factories
- [Plugin System](../../concepts/director-adapter-pattern.md) - low-level plugin registration
- [Search and Filtering Guide](../../guides/search-and-filtering.md) - search UX and query examples
