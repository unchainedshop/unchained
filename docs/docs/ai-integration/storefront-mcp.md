---
sidebar_position: 2
title: Storefront MCP
sidebar_label: Storefront MCP
description: Public, read-only product search for shopping assistants
---

# Storefront MCP

The storefront MCP plugin lets shopping assistants such as ChatGPT or Claude search your catalog as a guest and hand the shopper over to your shop. It serves one tool, `search_products`, at `/mcp/storefront`.

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import {
  createProductSearchTool,
  createStorefrontMcpPlugin,
  storefrontMcpAdminPlugin,
  storefrontMcpResolvers,
  storefrontMcpTypeDefs,
} from '@unchainedshop/plugins/mcp/storefront';

pluginRegistry.register(
  createStorefrontMcpPlugin({
    shopName: 'My Shop',
    shopUrl: 'https://shop.example.com',
    tools: [
      createProductSearchTool({
        productUrl: ({ slug, locale }) => `https://shop.example.com/${locale.baseName}/${slug}`,
      }),
    ],
  }),
);

const platform = await startPlatform({
  typeDefs: storefrontMcpTypeDefs,
  resolvers: [storefrontMcpResolvers],
});
await connect(fastify, platform, { adminUI: { plugins: [storefrontMcpAdminPlugin()] } });
```

Install the optional peer dependency `@modelcontextprotocol/server`.

## Search inputs

In Admin UI, open an active filter, select **Assistants** and expose it under an input name. Single-choice filters list their options, multiple-choice filters accept a list, switches a boolean and ranges a `lower:upper` string. The filter's title and subtitle describe the input, so state units there, for example "CHF in Rappen". Combine it with the [catalog price filter](../plugins/filters/filter-catalog-price.md) for budget searches.

`query`, `product_ids`, `offset` and `limit` are always available. `sort` appears when your schema extends `SearchOrderBy`. Unknown or outdated inputs fail with the list of accepted inputs.

## Market

Each call searches one market:

- **Country:** the `X-Shop-Country` header, else ChatGPT's `openai/userLocation` hint, else the shop default. The currency follows the country.
- **Language:** ChatGPT's `openai/locale` hint, else `Accept-Language`.

Results state the market they used. Every request is a guest request, even when the client sends credentials.

## Product cards

Pass `ui: { uri, html, csp }` to `createProductSearchTool` to render results with your own [MCP Apps](https://apps.extensions.modelcontextprotocol.io/) view. The Kitchensink example ships one.

## Discovery

With `shopUrl`, the plugin serves `/.well-known/ocp.json`, an [OCP](https://opencommerceprotocol.org/docs/spec) manifest that names the shop and links the MCP endpoint. It claims no OCP tools.
