---
sidebar_position: 32
title: HTTP Request Worker
sidebar_label: HTTP Request
description: Process outbound HTTP requests and webhooks
---

# HTTP Request Worker

Handles outbound HTTP requests for webhooks and external API integrations.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { HttpRequestPlugin } from '@unchainedshop/plugins/worker/http-request';

pluginRegistry.register(HttpRequestPlugin);
```

## Usage

Create HTTP request work:

```graphql
mutation CreateWebhook {
  addWork(
    type: HTTP_REQUEST
    input: {
      url: "https://api.example.com/webhook"
      method: "POST"
      headers: { Authorization: "Bearer token" }
      data: { event: "order.created", orderId: "123" }
    }
  ) {
    _id
    status
  }
}
```

## Input Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | String | Target URL (required) |
| `method` | String | HTTP method: `GET` or `POST` (default: POST) |
| `headers` | Object | Request headers |
| `data` | Object | Request body for POST requests (JSON serialized, `Content-Type: application/json`) |

The work item succeeds only on HTTP status 200; JSON responses are parsed, other responses are returned as `{ text }`.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.http-request` |
| Type | `HTTP_REQUEST` |
| Source | [worker/http-request](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/http-request) |

## Related

- [Events System](../events/events-node.md)
- [Worker System](../../extend/worker.md)
- [Plugins Overview](./)
