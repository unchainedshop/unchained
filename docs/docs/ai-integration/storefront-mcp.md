---
sidebar_position: 2
title: Storefront MCP
sidebar_label: Storefront MCP
description: Public, read-only product search for shopping assistants
---

# Storefront MCP

The storefront MCP plugin lets shopping assistants such as ChatGPT or Claude search your catalog and hand the shopper over to your shop. It serves one tool, `search_products`, at `/mcp/storefront`.

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import {
  createProductSearchTool,
  createStorefrontMcpPlugin,
} from '@unchainedshop/plugins/mcp/storefront';

pluginRegistry.register(
  createStorefrontMcpPlugin({
    shopName: 'My Shop',
    shopUrl: 'https://shop.example.com',
    tools: [
      createProductSearchTool({
        productUrl: ({ slug, locale }) => `https://shop.example.com/${locale.baseName}/${slug}`,
        inputs: { brand: 'meta.brand', price: 'price_ch' },
      }),
    ],
  }),
);
```

Install the optional peer dependency `@modelcontextprotocol/server`.

## Search inputs

`inputs` maps input names to filter keys. Each active filter among them becomes an input of `search_products`:

- single-choice filters list their options;
- multiple-choice filters accept a list;
- switches take a boolean;
- ranges take a `lower:upper` string.

The filter's title and subtitle describe the input, so state units there, for example "CHF in Rappen". Combine it with the [catalog price filter](../plugins/filters/filter-catalog-price.md) for budget searches.

Input names are letters, digits and `_`, other than the built-in `query`, `product_ids`, `sort`, `offset` and `limit`. Invalid names fail at startup. `sort` appears when your schema extends `SearchOrderBy`. Changed options and deactivated filters show on the next discovery, and inputs a client no longer may use fail with the list of accepted inputs.

## Market and caller

Each call searches the market the shop's context resolver picks for the request, for example from `X-Shop-Country` and `Accept-Language`. ChatGPT's hints override it: `openai/locale` sets the language, and `openai/userLocation` sets the country unless `X-Shop-Country` is sent. The currency follows the country, and results state the market they used.

Searches run with the caller's permissions like GraphQL. Anonymous callers get the guest rules, and results only ever include active products.

## Product cards

Pass `ui: { uri, html, csp }` to `createProductSearchTool` to render results with your own [MCP Apps](https://apps.extensions.modelcontextprotocol.io/) view. The Kitchensink example ships one.

## Discovery

With `shopUrl`, the plugin serves `/.well-known/ocp.json`, an [OCP](https://opencommerceprotocol.org/docs/spec) manifest that names the shop and links the MCP endpoint. It claims no OCP tools.
