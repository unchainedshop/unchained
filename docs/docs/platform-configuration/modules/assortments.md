---
sidebar_position: 1
title: Assortments Options
sidebar_label: Assortments
---

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
      zipTree: zipTreeBySimplyFlattening
    },
  }
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