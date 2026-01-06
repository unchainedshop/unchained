---
sidebar_position: 1
title: Assortments Module
sidebar_label: Assortments
description: Product categorization and hierarchical organization
---

# Assortments Module

The assortments module manages product categorization, hierarchical structures, and product caching.

## Configuration Options

```typescript
export interface AssortmentsSettingsOptions {
  getCachedProductIds: (
    assortmentId: string,
  ) => Promise<undefined | string[]>;

  setCachedProductIds: (
    assortmentId: string,
    productIds: string[],
  ) => Promise<number>;

  slugify: (title: string) => string;

  zipTree: (data: Tree<string>) => string[];
}
```

### Default Slugifier

- [slugify](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/slugify.ts)

### Default Caching Implementation

- [mongodb](https://github.com/unchainedshop/unchained/blob/master/packages/core-assortments/src/product-cache/mongodb.ts)

### Built-in Tree Zippers

- [zipTreeByDeepness](https://github.com/unchainedshop/unchained/blob/master/packages/core-assortments/src/utils/tree-zipper/zipTreeByDeepness.ts) (default) - Interleaves products by depth
- [zipTreeBySimplyFlattening](https://github.com/unchainedshop/unchained/blob/master/packages/core-assortments/src/utils/tree-zipper/zipTreeBySimplyFlattening.ts) - Flattens assortments sequentially

## Product Caching and Tree Zipping

### Overview

Assortments can form hierarchical structures (directed acyclic graphs). When products are added or modified, the system automatically recalculates cached product lists for all parent assortments.

### Example Structure

Consider this assortment hierarchy:

```
- A
  - A1
  - A2
    - SPECIAL
- B
  - SPECIAL
```

When a product is added to `SPECIAL`, the system recalculates product caches for `SPECIAL`, `A2`, `A`, and `B`.

### Default Behavior (zipTreeByDeepness)

The default `zipTreeByDeepness` function interleaves products by depth level:

```
1. Products directly linked to A
2. Product 1 from A1
3. Product 1 from A2
4. Product 2 from A1
5. Product 2 from A2
...
```

This creates a deterministic but mixed ordering across all child assortments.

### Custom Ordering

To order products sequentially by assortment instead, use `zipTreeBySimplyFlattening`:

```typescript
import zipTreeBySimplyFlattening from "@unchainedshop/core-assortments/tree-zipper/zipTreeBySimplyFlattening";

const options = {
  modules: {
    assortments: {
      zipTree: zipTreeBySimplyFlattening,
    },
  },
};
```

This produces sequential ordering:

```
1. Products directly linked to A
2. All products from A1
3. All products from A2
```

### Cache Integration

After calculating the product order, the system calls `setCachedProductIds` to store the result. This cached data is retrieved via `getCachedProductIds` and powers the `Assortment.searchProducts` GraphQL field with default sorting.

:::warning
If you customize `setCachedProductIds`, ensure you also customize `getCachedProductIds`.
:::

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ASSORTMENT_CREATE` | `{ assortment }` | Emitted when an assortment is created |
| `ASSORTMENT_UPDATE` | `{ assortmentId }` | Emitted when an assortment is updated |
| `ASSORTMENT_REMOVE` | `{ assortmentId }` | Emitted when an assortment is removed |
| `ASSORTMENT_ADD_PRODUCT` | `{ assortmentProduct }` | Emitted when a product is added |
| `ASSORTMENT_REMOVE_PRODUCT` | `{ assortmentProductId }` | Emitted when a product is removed |
| `ASSORTMENT_REORDER_PRODUCTS` | `{ assortmentProducts }` | Emitted when products are reordered |
| `ASSORTMENT_ADD_LINK` | `{ assortmentLink }` | Emitted when a link is added |
| `ASSORTMENT_REMOVE_LINK` | `{ assortmentLinkId }` | Emitted when a link is removed |
| `ASSORTMENT_ADD_FILTER` | `{ assortmentFilter }` | Emitted when a filter is added |
| `ASSORTMENT_REMOVE_FILTER` | `{ assortmentFilterId }` | Emitted when a filter is removed |
| `ASSORTMENT_REORDER_FILTERS` | `{ assortmentFilters }` | Emitted when filters are reordered |
| `ASSORTMENT_ADD_MEDIA` | `{ assortmentMedia }` | Emitted when media is added |
| `ASSORTMENT_REMOVE_MEDIA` | `{ assortmentMediaId }` | Emitted when media is removed |
| `ASSORTMENT_REORDER_MEDIA` | `{ assortmentMedias }` | Emitted when media is reordered |
| `ASSORTMENT_UPDATE_TEXT` | `{ assortmentId, locale }` | Emitted when text is updated |
| `ASSORTMENT_UPDATE_MEDIA_TEXT` | `{ assortmentMediaId }` | Emitted when media text is updated |

## More Information

For API usage and detailed documentation, see the [core-assortments package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-assortments).
