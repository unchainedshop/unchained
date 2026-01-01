---
sidebar_position: 2
title: Strict Equal Filter
sidebar_label: Strict Equal
description: Exact value matching filter adapter
---

# Strict Equal Filter

The Strict Equal filter provides simple exact-match filtering on product fields.

## Installation

```typescript
import '@unchainedshop/plugins/filters/strict-equal';
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.filters.strict-qual` |
| Order Index | `0` (runs first) |
| Version | `1.0.0` |
| Source | [filters/strict-equal.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/filters/strict-equal.ts) |

## Behavior

### `transformProductSelector()`

Transforms the query conditions to match exact values:

```typescript
// Input: { key: "brand", value: "nike" }
// Matches products where brand equals "nike"

// Input: { key: "inStock", value: undefined }
// Matches products where inStock field is not null
```

When `value` is provided, it matches exactly. When `value` is undefined, it checks for non-null values.

## Use Cases

### Single-Choice Filters

```graphql
# Create a brand filter
mutation CreateBrandFilter {
  createFilter(filter: {
    key: "brand"
    type: SINGLE_CHOICE
  }) {
    _id
  }
}
```

```graphql
# Add brand options
mutation AddBrandOption {
  createFilterOption(filterId: "...", option: "nike") {
    _id
  }
}
```

Products must have matching field:
```typescript
// Product document
{
  _id: "product-1",
  brand: "nike", // Matches filter key
}
```

### Multi-Choice Filters

```graphql
mutation {
  createFilter(filter: {
    key: "color"
    type: MULTI_CHOICE
  }) {
    _id
  }
}
```

### Boolean Filters

```graphql
mutation {
  createFilter(filter: {
    key: "isOrganic"
    type: SWITCH
  }) {
    _id
  }
}
```

## Query Example

```graphql
query FilteredProducts {
  searchProducts(
    filterQuery: [
      { key: "brand", value: "nike" }
      { key: "isOrganic", value: "true" }
    ]
  ) {
    products {
      _id
      texts { title }
    }
    filteredProductsCount
  }
}
```

## Product Field Mapping

The filter key maps directly to product fields. Common patterns:

| Filter Key | Product Field | Example Value |
|------------|--------------|---------------|
| `brand` | `brand` | `"nike"` |
| `color` | `color` | `"blue"` |
| `size` | `size` | `"M"` |
| `category` | `category` | `"clothing"` |
| `meta.material` | `meta.material` | `"cotton"` |

## Nested Field Filtering

For nested fields, use dot notation:

```
filterQuery: [
  { key: "meta.material", value: "cotton" }
  { key: "specs.weight", value: "500g" }
]
```

## Limitations

- **Exact matching only**: No partial matches, ranges, or fuzzy search
- **Case-sensitive**: `"Nike"` ≠ `"nike"`
- **Single value**: Each filter key matches one value

For more complex filtering, create a custom filter adapter or use [Local Search](./filter-local-search.md) for text queries.

## Combining with Other Filters

Strict Equal runs at `orderIndex: 0`, so it processes first. Subsequent adapters receive its transformed query conditions:

```typescript
// Strict Equal adds conditions
eq(products.brand, "nike"), eq(products.color, "blue")

// Next adapter (e.g., Local Search) receives this and can add FTS5 search
// Combined result filters by brand, color, AND full-text search
```

## Related

- [Plugins Overview](./) - All available plugins
- [Local Search](./filter-local-search.md) - Full-text search
- [Custom Filter Plugins](../../extend/catalog/filter.md) - Write your own
