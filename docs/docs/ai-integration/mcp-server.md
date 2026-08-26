---
title: MCP Server Reference
description: Reference documentation for the Model Context Protocol (MCP) server that enables AI agents to manage your Unchained store.
sidebar_label: MCP Server
sidebar_position: 2
---

# MCP Server

Unchained Engine includes a built-in [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes the full commerce API as AI-callable tools. Any MCP-compatible client — Claude Desktop, Claude Code, Cursor, or custom agents — can connect and manage your store programmatically.

The MCP server is available at the `/mcp` endpoint (configurable via the `MCP_API_PATH` environment variable). The only requirement is the optional peer package `@modelcontextprotocol/server` in your app's dependencies — without it, the endpoint responds with `503`.

## Authentication

- **Admin-only**: The MCP server requires an authenticated user with the `admin` role. Authenticated non-admin users receive a `403`.
- **Bearer token**: Pass your session token via `Authorization: Bearer <token>` header or through cookies.
- **401 behavior**: Unauthenticated requests receive a `401` with OAuth resource metadata (`WWW-Authenticate: Bearer realm="Unchained MCP"`).
- **Browser protection**: Requests carrying an `Origin` header are validated against the `ROOT_URL` hostname (plus localhost) to prevent DNS rebinding — untrusted origins receive a `403`. Non-browser clients without an `Origin` header are unaffected.

## Transport

The server uses the **Streamable HTTP** transport (the standard MCP HTTP transport) in **stateless** mode:

- **POST** `/mcp` — JSON-RPC messages (`initialize`, `tools/list`, `tools/call`, `resources/read`, ...). Responses arrive as JSON or as an SSE stream, depending on your `Accept` header.
- Every request is authenticated and served independently — no `mcp-session-id` header is issued, nothing is stored between requests, and the endpoint works across multiple replicas.
- **GET** `/mcp` (standalone SSE stream) returns `405` — there are no server-initiated streams in stateless mode.

## Tools

The MCP server exposes 9 tools, one per management area, each taking an `action` argument:

`product_management`, `order_management`, `assortment_management`, `users_management`, `filter_management`, `system_management`, `localization_management`, `provider_management`, `quotation_management`

### 1. Product Management (`product_management`)

Full product lifecycle including media, variations, bundles, and pricing.

| Operation group | Actions |
|----------------|---------|
| CRUD | `CREATE`, `UPDATE`, `REMOVE`, `GET`, `LIST`, `COUNT` |
| Status | `UPDATE_STATUS` (publish/unpublish) |
| Media | `ADD_MEDIA`, `REMOVE_MEDIA`, `REORDER_MEDIA`, `GET_MEDIA`, `UPDATE_MEDIA_TEXTS` |
| Variations | `CREATE_VARIATION`, `REMOVE_VARIATION`, `ADD_VARIATION_OPTION`, `REMOVE_VARIATION_OPTION`, `UPDATE_VARIATION_TEXTS` |
| Assignments | `ADD_ASSIGNMENT`, `REMOVE_ASSIGNMENT`, `GET_ASSIGNMENTS`, `GET_VARIATION_PRODUCTS` |
| Bundles | `ADD_BUNDLE_ITEM`, `REMOVE_BUNDLE_ITEM`, `GET_BUNDLE_ITEMS` |
| Pricing | `SIMULATE_PRICE`, `SIMULATE_PRICE_RANGE`, `GET_CATALOG_PRICE` |
| Text | `GET_PRODUCT_TEXTS`, `GET_MEDIA_TEXTS`, `GET_VARIATION_TEXTS` |
| Reviews | `GET_REVIEWS`, `COUNT_REVIEWS` |
| Other | `GET_SIBLINGS` |

Supported product types: `SIMPLE`, `CONFIGURABLE`, `BUNDLE`, `PLAN`, `TOKENIZED`.

### 2. Order Management (`order_management`)

Read-only order listing and analytics.

| Operation group | Actions |
|----------------|---------|
| Queries | `LIST` |
| Analytics | `SALES_SUMMARY` (daily), `MONTHLY_BREAKDOWN` (12 months), `TOP_CUSTOMERS`, `TOP_PRODUCTS` |

Supports date-range filtering and provider-based segmentation.

### 3. Assortment Management (`assortment_management`)

Category trees with products, filters, links, and media.

| Operation group | Actions |
|----------------|---------|
| CRUD | `CREATE`, `UPDATE`, `REMOVE`, `GET`, `LIST`, `COUNT` |
| Status | `UPDATE_STATUS` (activate/deactivate) |
| Media | `ADD_MEDIA`, `REMOVE_MEDIA`, `REORDER_MEDIA`, `GET_MEDIA`, `UPDATE_MEDIA_TEXTS` |
| Products | `ADD_PRODUCT`, `REMOVE_PRODUCT`, `GET_PRODUCTS`, `REORDER_PRODUCTS` |
| Filters | `ADD_FILTER`, `REMOVE_FILTER`, `GET_FILTERS`, `REORDER_FILTERS` |
| Links | `ADD_LINK`, `REMOVE_LINK`, `GET_LINKS`, `REORDER_LINKS` |
| Navigation | `GET_CHILDREN`, `SET_BASE` |
| Search | `SEARCH_PRODUCTS` |

### 4. User Management (`users_management`)

Full user lifecycle, roles, emails, and related data.

| Operation group | Actions |
|----------------|---------|
| CRUD | `LIST`, `GET`, `CREATE`, `UPDATE`, `REMOVE`, `COUNT` |
| Enrollment | `ENROLL`, `SEND_ENROLLMENT_EMAIL`, `SEND_VERIFICATION_EMAIL` |
| Admin | `SET_ROLES`, `SET_TAGS`, `SET_PASSWORD`, `SET_USERNAME` |
| Email | `ADD_EMAIL`, `REMOVE_EMAIL` |
| Data access | `GET_ORDERS`, `GET_ENROLLMENTS`, `GET_QUOTATIONS`, `GET_BOOKMARKS`, `GET_CART`, `GET_PAYMENT_CREDENTIALS`, `GET_AVATAR`, `GET_REVIEWS`, `GET_REVIEWS_COUNT` |
| Current user | `GET_CURRENT_USER` |

### 5. Filter Management (`filter_management`)

Search filters with options and localized texts.

| Operation group | Actions |
|----------------|---------|
| CRUD | `CREATE`, `UPDATE`, `REMOVE`, `GET`, `LIST`, `COUNT` |
| Options | `CREATE_OPTION`, `REMOVE_OPTION` |
| Text | `UPDATE_TEXTS`, `GET_TEXTS` |

### 6. System Management (`system_management`)

Shop info, background workers, and event logs.

| Operation group | Actions |
|----------------|---------|
| Shop | `SHOP_INFO` |
| Workers | `WORKER_ADD`, `WORKER_REMOVE`, `WORKER_GET`, `WORKER_LIST`, `WORKER_COUNT`, `WORKER_ALLOCATE`, `WORKER_FINISH_WORK`, `WORKER_PROCESS_NEXT`, `WORKER_STATISTICS`, `WORKER_ACTIVE_WORK_TYPES` |
| Events | `EVENT_GET`, `EVENT_LIST`, `EVENT_COUNT`, `EVENT_STATISTICS` |

### 7. Localization Management (`localization_management`)

Countries, currencies, and languages.

| Operation group | Actions |
|----------------|---------|
| All entities | `CREATE`, `UPDATE`, `REMOVE` |

Countries use 2-letter ISO codes, currencies use 3-letter ISO codes, languages use BCP 47 locale codes.

### 8. Provider Management (`provider_management`)

Payment, delivery, and warehousing providers.

| Operation group | Actions |
|----------------|---------|
| CRUD | `CREATE`, `UPDATE`, `REMOVE`, `GET`, `LIST` |
| Discovery | `INTERFACES` (list available adapter types) |

### 9. Quotation Management (`quotation_management`)

Request-for-quote lifecycle.

| Operation group | Actions |
|----------------|---------|
| Queries | `LIST`, `GET`, `COUNT` |
| Lifecycle | `REQUEST`, `VERIFY`, `MAKE_PROPOSAL`, `REJECT` |

## Resources

The MCP server exposes 3 read-only resources that provide shop configuration:

| Resource URI | Description |
|-------------|-------------|
| `unchained://shop/languages` | Active languages with ISO codes and BCP 47 format |
| `unchained://shop/currencies` | Active currencies with ISO codes and decimal precision |
| `unchained://shop/countries` | Active countries with ISO codes |

AI agents should check these resources **before** using localization tools to validate that an entity exists.

## Important notes

- **Prices are integers**: All monetary values are stored as integers. Check the currency resource for decimal precision (e.g., CHF has 2 decimals, so `1990` = `19.90 CHF`).
- **Resource validation**: Always check resources before creating or referencing localization entities to avoid errors.
- **Stateless**: There is no session state to lose — reconnecting is just sending the next request with valid credentials.

## Connecting AI clients

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "unchained": {
      "url": "https://your-engine.example.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_ADMIN_TOKEN"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add unchained \
  --transport http \
  --url https://your-engine.example.com/mcp \
  --header "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "unchained": {
      "url": "https://your-engine.example.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_ADMIN_TOKEN"
      }
    }
  }
}
```

### Custom agents (TypeScript)

The simplest client is the Vercel AI SDK's MCP client (`@ai-sdk/mcp`) — it is also what the [Admin Copilot](./admin-copilot) uses internally to connect to this server:

```typescript
import { createMCPClient } from '@ai-sdk/mcp';
import { streamText } from 'ai';

const client = await createMCPClient({
  transport: {
    type: 'http',
    url: 'https://your-engine.example.com/mcp',
    headers: { Authorization: 'Bearer YOUR_ADMIN_TOKEN' },
  },
});

try {
  // Derive the tool set and hand it to any AI SDK model
  const tools = await client.tools();

  const result = streamText({
    model: yourModel,
    tools,
    prompt: 'List the 10 newest products',
  });
  // ...
} finally {
  await client.close();
}
```

Because the server is stateless, you can also talk to it with plain JSON-RPC over HTTP from any language:

```bash
curl https://your-engine.example.com/mcp \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"system_management","arguments":{"action":"SHOP_INFO"}}}'
```
