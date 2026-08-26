---
sidebar_position: 2
title: Strict Equal Filter
sidebar_label: Strict Equal
description: Exact value matching filter adapter
---

# Strict Equal Filter

Exact-match filtering on product fields: each active filter key/value pair is added to the MongoDB product selector as-is.

:::info Included in All Preset
Registered automatically by `registerAllPlugins()`.
:::

If you use the `base` preset or register plugins individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { StrictQualFilterPlugin } from '@unchainedshop/plugins/filters/strict-equal';

pluginRegistry.register(StrictQualFilterPlugin);
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.filters.strict-qual` |
| Order Index | `0` (runs first) |
| Source | [filters/strict-equal](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/filters/strict-equal) |

:::note
The adapter key really is `strict-qual`, not `strict-equal`.
:::

## Behavior

`transformProductSelector()` merges the filter key/value into the product selector:

```typescript
// { key: "brand", value: "nike" }   → { brand: "nike" }
// { key: "inStock", value: undefined } → { inStock: { $exists: true } }
```

The filter key maps directly to a product document field (dot notation works for nested fields, e.g. `meta.material`). Matching is exact and case-sensitive; there are no ranges or partial matches — use [Local Search](./filter-local-search.md) for text queries or a custom adapter for anything else.

Because it runs at `orderIndex: 0`, subsequent filter adapters receive its transformed selector.

## Usage

Create a filter whose key matches a product field:

```graphql
mutation CreateBrandFilter {
  createFilter(filter: {
    key: "brand"
    type: SINGLE_CHOICE
  }) {
    _id
  }
}

mutation AddBrandOption {
  createFilterOption(filterId: "...", option: "nike") {
    _id
  }
}
```

Query with it:

```graphql
query FilteredProducts {
  searchProducts(
    filterQuery: [{ key: "brand", value: "nike" }]
  ) {
    products {
      _id
      texts { title }
    }
    filteredProductsCount
  }
}
```

## Related

- [Local Search](./filter-local-search.md) - Full-text search
- [Custom Filter Plugins](../../extend/catalog/filter.md) - Write your own
