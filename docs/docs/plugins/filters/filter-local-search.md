---
sidebar_position: 3
title: Local Search Filter
sidebar_label: Local Search
description: MongoDB full-text search filter adapter
---

# Local Search Filter

The Local Search filter provides full-text search using MongoDB's built-in text search capabilities.

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

- MongoDB text indexes on product and assortment text collections
- **Not compatible with AWS DocumentDB** (automatically disabled in DocumentDB compat mode)

## Behavior

### `searchProducts()`

Searches product text fields using MongoDB `$text` operator:

```typescript
// Search in product texts (title, description, etc.)
const selector = {
  $text: { $search: queryString },
};

// If productIds provided, filter to those products
if (productIds) {
  selector.productId = { $in: productIds };
}
```

### `searchAssortments()`

Searches assortment/category text fields:

```typescript
const selector = {
  $text: { $search: queryString },
};

if (assortmentIds) {
  selector.assortmentId = { $in: assortmentIds };
}
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

## Text Index Configuration

MongoDB text indexes are created automatically. The default indexes search:

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

### Phrase Search

```
# Exact phrase
searchProducts(queryString: "\"running shoes\"")
```

### Negation

```
# Exclude terms
searchProducts(queryString: "shoes -sandals")
```

### Stemming

MongoDB applies stemming based on language:
- "running" matches "run", "runs", "runner"

## DocumentDB Compatibility

Local Search is automatically disabled when `UNCHAINED_DOCUMENTDB_COMPAT_MODE` is set:

```bash
UNCHAINED_DOCUMENTDB_COMPAT_MODE=true
```

In this case, implement an alternative search adapter using a service like:
- Elasticsearch
- Algolia
- Meilisearch
- OpenSearch

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
