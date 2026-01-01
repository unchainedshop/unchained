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
query SearchWithPagination($query: String!) {
  searchProducts(
    queryString: $query
  ) {
    filteredProductsCount
    products {
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
query ProductFilters($productId: ID!) {
  product(productId: $productId) {
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

## Frontend Implementation

### Search Component

```tsx
import { useState, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_PRODUCTS } from './queries';
import { useDebounce } from './hooks';

function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const [search, { data, loading }] = useLazyQuery(SEARCH_PRODUCTS);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search({ variables: { query: debouncedQuery } });
    }
  }, [debouncedQuery, search]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />

      {loading && <div>Searching...</div>}

      {data?.searchProducts?.products && (
        <div className="search-results">
          {data.searchProducts.products.map((product) => (
            <SearchResult key={product._id} product={product} />
          ))}
          <div>
            Found {data.searchProducts.filteredProductsCount} products
          </div>
        </div>
      )}
    </div>
  );
}
```

### Filter Sidebar

```tsx
import { useState } from 'react';

function FilterSidebar({ filters, selectedFilters, onFilterChange }) {
  return (
    <div className="filter-sidebar">
      {filters.map((filter) => (
        <FilterGroup
          key={filter.definition._id}
          filter={filter}
          selected={selectedFilters.filter((f) => f.key === filter.definition._id)}
          onChange={(values) => onFilterChange(filter.definition._id, values)}
        />
      ))}
    </div>
  );
}

function FilterGroup({ filter, selected, onChange }) {
  const selectedValues = selected.map((s) => s.value);

  const handleToggle = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="filter-group">
      <h4>{filter.texts?.title}</h4>
      {filter.options.map((option) => (
        <label key={option._id} className="filter-option">
          <input
            type="checkbox"
            checked={option.isSelected}
            onChange={() => handleToggle(option._id)}
          />
          <span>{option.texts?.title || option._id}</span>
          {option.filteredProductsCount !== undefined && (
            <span className="count">({option.filteredProductsCount})</span>
          )}
        </label>
      ))}
    </div>
  );
}
```

### Product List with Filters

```tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { SEARCH_PRODUCTS } from './queries';

function ProductListPage({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');

  const { data, loading } = useQuery(SEARCH_PRODUCTS, {
    variables: {
      query,
      filters: selectedFilters,
      sortBy,
    },
  });

  const handleFilterChange = (key, values) => {
    // Remove old filters for this key
    const otherFilters = selectedFilters.filter((f) => f.key !== key);

    // Add new filters
    const newFilters = values.map((value) => ({ key, value }));

    setSelectedFilters([...otherFilters, ...newFilters]);
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  return (
    <div className="product-list-page">
      <div className="search-header">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <div className="content">
        <FilterSidebar
          filters={data?.searchProducts?.filters || []}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
        />

        <div className="products">
          {selectedFilters.length > 0 && (
            <div className="active-filters">
              {selectedFilters.map((filter, i) => (
                <span key={i} className="filter-tag">
                  {filter.key}: {filter.value}
                  <button onClick={() => handleFilterChange(filter.key, [])}>
                    ×
                  </button>
                </span>
              ))}
              <button onClick={clearFilters}>Clear all</button>
            </div>
          )}

          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="results-count">
                {data?.searchProducts?.filteredProductsCount} products found
              </div>
              <div className="product-grid">
                {data?.searchProducts?.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

## URL-Based Filters

Sync filters with URL for shareable links:

```tsx
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';

function useUrlFilters() {
  const router = useRouter();

  // Parse filters from URL
  const filters = useMemo(() => {
    const result = [];
    Object.entries(router.query).forEach(([key, value]) => {
      if (key.startsWith('filter_')) {
        const filterKey = key.replace('filter_', '');
        const values = Array.isArray(value) ? value : [value];
        values.forEach((v) => result.push({ key: filterKey, value: v }));
      }
    });
    return result;
  }, [router.query]);

  // Update URL when filters change
  const setFilters = (newFilters) => {
    const query = { ...router.query };

    // Remove old filter params
    Object.keys(query).forEach((key) => {
      if (key.startsWith('filter_')) delete query[key];
    });

    // Add new filter params
    newFilters.forEach(({ key, value }) => {
      const paramKey = `filter_${key}`;
      if (query[paramKey]) {
        query[paramKey] = Array.isArray(query[paramKey])
          ? [...query[paramKey], value]
          : [query[paramKey], value];
      } else {
        query[paramKey] = value;
      }
    });

    router.push({ query }, undefined, { shallow: true });
  };

  return { filters, setFilters };
}
```

## Custom Filter Adapter

Create a custom filter adapter for advanced search:

```typescript
import { FilterDirector, type IFilterAdapter } from '@unchainedshop/core';

const ElasticsearchFilter: IFilterAdapter = {
  key: 'shop.example.filter.elasticsearch',
  label: 'Elasticsearch Filter',
  version: '1.0.0',
  orderIndex: 0,

  actions(context) {
    return {
      async searchProducts(params, options) {
        const { queryString, filterQuery } = params;

        // Build Elasticsearch query
        const esQuery = buildESQuery(queryString, filterQuery);

        // Search Elasticsearch
        const results = await elasticsearch.search({
          index: 'products',
          body: esQuery,
        });

        return {
          productIds: results.hits.hits.map((hit) => hit._id),
          totalCount: results.hits.total.value,
        };
      },

      async searchAssortments(params, options) {
        // Similar implementation for assortments
        return { assortmentIds: [], totalCount: 0 };
      },

      async aggregateProductIds(params) {
        // Return product IDs matching filter
        return [];
      },

      transformProductSelector(selector, options) {
        return selector;
      },

      transformFilterSelector(selector, options) {
        return selector;
      },

      transformSortStage(sort, options) {
        return sort;
      },
    };
  },
};

FilterDirector.registerAdapter(ElasticsearchFilter);
```

## Performance Tips

### 1. Indexes

Unchained automatically creates indexes for commonly queried fields during startup. Custom indexes for additional fields can be added in your Drizzle schema definitions.

### 2. Cache Filter Aggregations

Use Apollo cache or server-side caching:

```typescript
const { data } = useQuery(SEARCH_PRODUCTS, {
  variables: { query, filters },
  fetchPolicy: 'cache-and-network',
});
```

### 3. Debounce Search Input

```typescript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

## Related

- [Filter Plugins](../plugins/) - Filter adapters
- [Custom Filter Adapter](../extend/catalog/filter) - Building custom adapters
- [Search Behavior](../extend/catalog/search-behavior) - Search customization
