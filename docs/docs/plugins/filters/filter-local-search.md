---
sidebar_position: 3
title: Local Search Filter
sidebar_label: Local Search
description: MongoDB full-text search filter adapter
---

# Local Search Filter

Full-text product and assortment search using MongoDB `$text` queries against the text collections. No external search service required.

:::info Included in All Preset
Registered automatically by `registerAllPlugins()`.
:::

If you use the `base` preset or register plugins individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { LocalSearchPlugin } from '@unchainedshop/plugins/filters/local-search';

pluginRegistry.register(LocalSearchPlugin);
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.filters.local-search` |
| Order Index | `10` |
| Source | [filters/local-search](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/filters/local-search) |

## Behavior

- `searchProducts()` resolves `queryString` against the product texts collection via `$text: { $search }`, restricted to the already-selected product IDs when present.
- `searchAssortments()` does the same against the assortment texts collection.
- `transformFilterSelector()`: for global searches (a `queryString` without explicit `filterIds`), all active filters are returned instead of only assortment-linked ones.

The required text indexes are created automatically at startup:

| Collection | Indexed fields (weight) |
|------------|-------------------------|
| `product_texts` | `title` (8), `subtitle` (6), `vendor` (5), `brand` (4) |
| `products` | `warehousing.sku`, `slugs` |
| `assortment_texts` | `title` (8), `subtitle` (6) |

Query strings follow MongoDB `$text` semantics (stemming, `"exact phrase"`, `-negation`).

## Query Examples

```graphql
query SearchProducts {
  searchProducts(queryString: "running shoes") {
    products {
      _id
      texts { title description }
    }
    filteredProductsCount
  }
}
```

```graphql
query SearchWithFilters {
  searchProducts(
    queryString: "organic cotton"
    filterQuery: [
      { key: "category", value: "clothing" }
      { key: "size", value: "M" }
    ]
  ) {
    products {
      _id
      texts { title }
    }
    filters {
      filteredProductsCount
      isSelected
      options {
        filteredProductsCount
        isSelected
      }
    }
  }
}
```

```graphql
query SearchCategories {
  searchAssortments(queryString: "summer collection") {
    assortments {
      _id
      texts { title }
    }
  }
}
```

## External Search Services

For Algolia, Elasticsearch, etc., register a search callback with the factory functions instead of building a filter adapter by hand:

```typescript
import {
  registerAssortmentSearchFilter,
  registerProductSearchFilter,
} from '@unchainedshop/core';

registerProductSearchFilter({
  adapterId: 'algolia',
  orderIndex: 10,
  search: async ({ queryString }) => {
    const { hits } = await productIndex.search(queryString, { hitsPerPage: 1000 });
    return hits.map((hit) => hit.productId);
  },
});

registerAssortmentSearchFilter({
  adapterId: 'algolia',
  orderIndex: 10,
  search: async ({ queryString }) => {
    const { hits } = await assortmentIndex.search(queryString);
    return hits.map((hit) => hit.assortmentId);
  },
});
```

## Related

- [Strict Equal Filter](./filter-strict-equal.md) - Exact matching
- [Search and Filtering Guide](../../guides/search-and-filtering.md) - Implementation guide
- [Custom Filter Plugins](../../extend/catalog/filter.md) - Write your own
