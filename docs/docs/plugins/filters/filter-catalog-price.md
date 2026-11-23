---
sidebar_position: 4
title: Catalog Price Filter
sidebar_label: Catalog Price
description: RANGE filters over the quantity-one catalog price of one market
---

# Catalog Price Filter

Turns RANGE filters into budget filters. Each configured filter indexes the quantity-one catalog prices of one country and currency, so its options and their product counts form a price histogram for that market.

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { createCatalogPriceFilterPlugin } from '@unchainedshop/plugins/filters/catalog-price';

pluginRegistry.register(
  createCatalogPriceFilterPlugin({
    filters: {
      price_ch: { countryCode: 'CH', currencyCode: 'CHF' },
      price_de: { countryCode: 'DE', currencyCode: 'EUR' },
    },
  }),
);
```

Then create an active RANGE filter for each key, for example `price_ch`, without options.

## Behavior

- The options are generated whenever the filter cache is rebuilt (startup, filter changes, bulk import), so price edits apply after the next rebuild.
- Values are inclusive integers in the currency's minor units: `0:5000`, `:5000`, `5000:` or an exact `3900`.
- A configurable product matches through the prices of its active variants. Products without a price in the market are left out.
- A search only sees the price filters of its own market, so a request from Switzerland gets the `price_ch` histogram and ignores `price_de`.

```graphql
query BudgetSearch {
  searchProducts(filterQuery: [{ key: "price_ch", value: ":5000" }]) {
    products {
      _id
    }
    filters {
      definition {
        key
      }
      options {
        definition {
          value
        }
        filteredProductsCount
      }
    }
  }
}
```

## Related

- [Search and Filtering Guide](../../guides/search-and-filtering.md)
- [Storefront MCP](../../ai-integration/storefront-mcp.md)
