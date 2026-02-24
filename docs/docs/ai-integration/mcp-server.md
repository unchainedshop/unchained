---
title: MCP Server Reference
sidebar_label: MCP Server
sidebar_position: 2
---

# MCP Server

Unchained Engine includes a built-in [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes the full commerce API as AI-callable tools. Any MCP-compatible client — Claude Desktop, Claude Code, Cursor, or custom agents — can connect and manage your store programmatically.

The MCP server is always available at the `/mcp` endpoint (configurable via `MCP_API_PATH` environment variable). No additional setup is needed beyond running Unchained Engine.

## Authentication

- **Admin-only**: The MCP server requires an authenticated user with the `admin` role.
- **Bearer token**: Pass your session token via `Authorization: Bearer <token>` header or through cookies.
- **401 behavior**: Unauthenticated requests receive a `401` response with OAuth resource metadata.

## Transport

The server uses the **Streamable HTTP** transport (the standard MCP HTTP transport):

- **POST** `/mcp` — Send client messages (tool calls, resource reads)
- **GET** `/mcp` — Query existing sessions
- **DELETE** `/mcp` — Clean up sessions

Sessions are identified by the `mcp-session-id` header, generated on first connection.

## Tool categories

The MCP server organizes its tools into 9 categories with granular operations:

### 1. Product Management

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

### 2. Order Management

Read-only order listing and analytics.

| Operation group | Actions |
|----------------|---------|
| Queries | `LIST` |
| Analytics | `SALES_SUMMARY` (daily), `MONTHLY_BREAKDOWN` (12 months), `TOP_CUSTOMERS`, `TOP_PRODUCTS` |

Supports date-range filtering and provider-based segmentation.

### 3. Assortment Management

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

### 4. User Management

Full user lifecycle, roles, emails, and related data.

| Operation group | Actions |
|----------------|---------|
| CRUD | `LIST`, `GET`, `CREATE`, `UPDATE`, `REMOVE`, `COUNT` |
| Enrollment | `ENROLL`, `SEND_ENROLLMENT_EMAIL`, `SEND_VERIFICATION_EMAIL` |
| Admin | `SET_ROLES`, `SET_TAGS`, `SET_PASSWORD`, `SET_USERNAME` |
| Email | `ADD_EMAIL`, `REMOVE_EMAIL` |
| Data access | `GET_ORDERS`, `GET_ENROLLMENTS`, `GET_QUOTATIONS`, `GET_BOOKMARKS`, `GET_CART`, `GET_PAYMENT_CREDENTIALS`, `GET_AVATAR`, `GET_REVIEWS`, `GET_REVIEWS_COUNT` |
| Current user | `GET_CURRENT_USER` |

### 5. Filter Management

Search filters with options and localized texts.

| Operation group | Actions |
|----------------|---------|
| CRUD | `CREATE`, `UPDATE`, `REMOVE`, `GET`, `LIST`, `COUNT` |
| Options | `CREATE_OPTION`, `REMOVE_OPTION` |
| Text | `UPDATE_TEXTS`, `GET_TEXTS` |

### 6. System Management

Shop info, background workers, and event logs.

| Operation group | Actions |
|----------------|---------|
| Shop | `SHOP_INFO` |
| Workers | `WORKER_ADD`, `WORKER_REMOVE`, `WORKER_GET`, `WORKER_LIST`, `WORKER_COUNT`, `WORKER_ALLOCATE`, `WORKER_FINISH_WORK`, `WORKER_PROCESS_NEXT`, `WORKER_STATISTICS`, `WORKER_ACTIVE_WORK_TYPES` |
| Events | `EVENT_GET`, `EVENT_LIST`, `EVENT_COUNT`, `EVENT_STATISTICS` |

### 7. Localization Management

Countries, currencies, and languages.

| Operation group | Actions |
|----------------|---------|
| All entities | `CREATE`, `UPDATE`, `REMOVE` |

Countries use 2-letter ISO codes, currencies use 3-letter ISO codes, languages use BCP 47 locale codes.

### 8. Provider Management

Payment, delivery, and warehousing providers.

| Operation group | Actions |
|----------------|---------|
| CRUD | `CREATE`, `UPDATE`, `REMOVE`, `GET`, `LIST` |
| Discovery | `INTERFACES` (list available adapter types) |

### 9. Quotation Management

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
- **Session management**: Sessions are stored in memory and cleaned up when closed. Long-running agents should handle reconnection.

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

```typescript
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const transport = new StreamableHTTPClientTransport(
  new URL('https://your-engine.example.com/mcp'),
  {
    requestInit: {
      headers: {
        Authorization: 'Bearer YOUR_ADMIN_TOKEN',
      },
    },
  },
);

const client = new Client({ name: 'my-agent', version: '1.0.0' });
await client.connect(transport);

// List available tools
const { tools } = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: 'product_management',
  arguments: { operation: 'LIST', limit: 10 },
});
```
