---
sidebar_position: 3
title: Local Search Filter
sidebar_label: Local Search
description: SQLite FTS5 full-text search filter adapter
---

# Local Search Filter

The Local Search filter provides full-text search using SQLite's FTS5 (Full-Text Search 5) capabilities.

:::note v5 Changes
In Unchained Engine v5, the search implementation uses SQLite FTS5 instead of MongoDB `$text` indexes. The API remains the same, but the underlying search engine has changed.
:::

## Installation

```typescript
import '@unchainedshop/plugins/filters/local-search';
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.filters.local-search` |
| Order Index | `10` |
| Version | `1.0.0` |
| Source | [filters/local-search.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/filters/local-search.ts) |

## Requirements

- FTS5 virtual tables are automatically created during schema initialization
- Triggers automatically sync data between main tables and FTS tables

## Behavior

### `searchProducts()`

Searches product text fields using SQLite FTS5:

```typescript
// Uses the products_fts virtual table
// Returns product IDs matching the search query, ordered by BM25 relevance
const matchingIds = await searchProductsFTS(db, queryString);
```

### `searchAssortments()`

Searches assortment/category text fields:

```typescript
// Uses the assortments_fts virtual table
const matchingIds = await searchAssortmentsFTS(db, queryString);
```

### `transformFilterSelector()`

For global searches (no specific assortment), returns all active filters:

```typescript
// When searching globally, show all filters
if (queryString && !filterIds) {
  return { isActive: true };
}
```

## Query Examples

### Basic Text Search

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

### Combined Search and Filter

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

### Search Assortments

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

## FTS5 Index Configuration

FTS5 virtual tables are created automatically during schema initialization. The default indexes search:

**Product Texts:**
- `title`
- `subtitle`
- `description`
- `vendor`
- `brand`
- `labels`

**Assortment Texts:**
- `title`
- `subtitle`
- `description`

## Search Features

### Prefix Search

FTS5 supports prefix matching by default:

```
# Prefix search (matches "running", "runner", etc.)
searchProducts(queryString: "run*")
```

### Phrase Search

```
# Exact phrase
searchProducts(queryString: "\"running shoes\"")
```

### Boolean Search

```
# AND/OR/NOT operators
searchProducts(queryString: "shoes NOT sandals")
```

### BM25 Ranking

Results are automatically ranked by BM25 relevance score, returning the most relevant matches first.

## Custom Search Adapter

For external search services:

```typescript
import { FilterDirector, FilterAdapter, type IFilterAdapter } from '@unchainedshop/core';

const AlgoliaSearchAdapter: IFilterAdapter = {
  ...FilterAdapter,

  key: 'my-shop.algolia-search',
  label: 'Algolia Search',
  version: '1.0.0',
  orderIndex: 10,

  actions: (params) => {
    const { searchQuery, modules } = params;

    return {
      ...FilterAdapter.actions(params),

      async searchProducts({ productIds }) {
        const { queryString } = searchQuery;
        if (!queryString) return productIds;

        const algoliaClient = algoliasearch(
          process.env.ALGOLIA_APP_ID,
          process.env.ALGOLIA_API_KEY
        );
        const index = algoliaClient.initIndex('products');

        const { hits } = await index.search(queryString, {
          filters: productIds
            ? `productId:${productIds.join(' OR productId:')}`
            : undefined,
          hitsPerPage: 1000,
        });

        return hits.map(hit => hit.productId);
      },

      async searchAssortments({ assortmentIds }) {
        const { queryString } = searchQuery;
        if (!queryString) return assortmentIds;

        const algoliaClient = algoliasearch(
          process.env.ALGOLIA_APP_ID,
          process.env.ALGOLIA_API_KEY
        );
        const index = algoliaClient.initIndex('assortments');

        const { hits } = await index.search(queryString);
        return hits.map(hit => hit.assortmentId);
      },
    };
  },
};

FilterDirector.registerAdapter(AlgoliaSearchAdapter);
```

## Performance Considerations

1. **Index optimization**: Ensure text indexes exist and are properly configured
2. **Query limits**: Use pagination for large result sets
3. **Projection**: Only request needed fields
4. **Caching**: Consider caching frequent searches

## Related

- [Plugins Overview](./) - All available plugins
- [Strict Equal Filter](./filter-strict-equal.md) - Exact matching
- [Search and Filtering Guide](../../guides/search-and-filtering.md) - Implementation guide
- [Custom Filter Plugins](../../extend/catalog/filter.md) - Write your own
