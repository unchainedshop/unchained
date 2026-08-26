---
sidebar_position: 5
title: Search and Filtering
sidebar_label: Search and Filtering
description: Implementing product search and filtering with Unchained Engine
---

# Search and Filtering

This guide covers implementing product search and filtering in your storefront.

## Overview

Unchained Engine provides a flexible search and filter system:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Storefront │────▶│ FilterDirector   │────▶│ Filter Adapters │
│  (Search)   │◀────│ (Aggregation)    │◀────│ (Search Logic)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## Basic Search

### Text Search Query

```graphql
query SearchProducts($query: String!) {
  searchProducts(queryString: $query) {
    filteredProductsCount
    products {
      _id
      texts {
        title
        description
      }
      ... on SimpleProduct {
        simulatedPrice(currencyCode: "CHF") {
          amount
          currencyCode
        }
      }
      media {
        file {
          url
        }
      }
    }
  }
}
```

### Search with Pagination

```graphql
query SearchWithPagination($query: String, $limit: Int, $offset: Int) {
  searchProducts(
    queryString: $query,    
  ) {
    filteredProductsCount
    products(limit: $limit, offset: $offset) {
      _id
      texts {
        title
      }
    }
  }
}
```

## Filters

### Get Available Filters

```graphql
query GetFilters {
  filters {
    texts {
      title
    }
    options {
      texts {
        title
      }
    }
  }
}
```

### Search with Filters

```graphql
query FilteredSearch($query: String, $filters: [FilterQueryInput!]) {
  searchProducts(
    queryString: $query
    filterQuery: $filters
  ) {
    filteredProductsCount
    products {
      _id
      texts {
        title
      }
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

### Filter Query Input

```typescript
// Example filter queries
const filters = [
  // Single value
  { key: 'category', value: 'electronics' },

  // Multiple values (OR)
  { key: 'brand', value: 'apple' },
  { key: 'brand', value: 'samsung' },

  // Range filter
  { key: 'price', value: '100-500' },
];
```

## Filter Types

| Type | Description | Example |
|------|-------------|---------|
| `SINGLE_CHOICE` | Select one option | Category |
| `MULTI_CHOICE` | Select multiple options | Brand, Color |
| `RANGE` | Numeric range | Price, Weight |
| `SWITCH` | Boolean toggle | In Stock |

### Creating Filters

```graphql
mutation CreateFilter {
  createFilter(
    filter: {
      key: "brand"
      type: MULTI_CHOICE
      options: ["apple", "samsung"]
    }
    texts: [
      { locale: "en", title: "Brand" }
    ]
  ) {
    _id
    key
    type
    texts {
      title
    }
  }
}
```

Note: Filter option texts are managed separately via `updateFilterTexts`.

### Assigning Filters to Products

Filters are typically assigned through the Assortment system. Products inherit filters from their assortments, and filter options are managed separately through filter configuration.

```graphql
mutation LinkAssortmentFilter {
  addAssortmentFilter(assortmentId: "product-assortment", filterId: "filter-id") {
    _id
    assortment {
      _id
      texts {
        _id
        title
      }
    }
    filter {
      _id
      texts {
        _id
        title
      }
    }
  }
}
```

```graphql

mutation LinkAssortmentProduct {
  addAssortmentProduct(assortmentId: "product-assortment", productId: "product-id") {
    _id
    assortment {
      _id
      texts {
        _id
        title
      }
    }
    product {
      _id
      texts {
        _id
        title
      }
    }
  }
}
```

```graphql
query ProductFilters {
  product(productId: "product-id") {
    _id
    texts {
      title
    }
    assortmentPaths {
      links {
        assortmentId
      }
    }
  }
}
```

## Assortment-Based Filtering

Filter products within an assortment (category):

```graphql
query AssortmentProducts($assortmentId: ID!, $filters: [FilterQueryInput!]) {
  assortment(assortmentId: $assortmentId) {
    _id
    texts {
      title
    }
    searchProducts(filterQuery: $filters) {
      filteredProductsCount
      products {
        _id
        texts {
          title
        }
      }
      filters {
        filteredProductsCount
        isSelected
        options {
          filteredProductsCount
        }
      }
    }
  }
}
```

## Frontend Notes

The search result exposes everything a filter UI needs — for each filter, `isSelected` and `filteredProductsCount` per option (see the `filters` field in the queries above). Build your sidebar from that result instead of tracking counts client-side, debounce search input, and echo the active `filterQuery` pairs into the URL for shareable links.

## External search (Elasticsearch, Algolia, …)

To delegate product search to an external engine, use the [`registerProductSearchFilter`](../extend/plugin-factories.md#filters--search) factory — its `search` callback receives the query and returns the matching product ids:

```typescript
import { registerProductSearchFilter } from '@unchainedshop/core';

registerProductSearchFilter({
  adapterId: 'elasticsearch',
  search: async ({ queryString, locale }) => {
    const results = await elasticsearch.search({
      index: 'products',
      body: buildESQuery(queryString, locale),
    });
    return results.hits.hits.map((hit) => hit._id);
  },
});
```

For custom MongoDB selector / sort logic (rather than an external engine), build a `FilterAdapter` directly — see [Filters](../extend/catalog/filter.md).

## The Product-ID Cache

Filtering is not computed per request. Each filter's matching product ids are precomputed and served from a cache (MongoDB-backed by default). The cache is rebuilt automatically:

- **On startup** — unless you pass `workQueueOptions: { skipInvalidationOnStartup: true }` to `startPlatform`
- **On filter changes** — creating, updating, or removing filters and filter options triggers `FilterDirector.invalidateProductIdCache` for the affected filter
- **After a bulk import** — unless the import sets `skipCacheInvalidation` (see [Bulk Import](./bulk-import))

To swap the cache backend (e.g. Redis), provide `setCachedProductIds`, `getCachedProductIds`, and `purgeCachedProductIds` together in the filters module options — see [Filters Module](../platform-configuration/modules/filters.md).

## Related

- [Filter Plugins](../plugins/) - Filter adapters
- [Custom Filter Adapter](../extend/catalog/filter) - Building custom adapters
- [Search Behavior](../extend/catalog/search-behavior) - Search customization
