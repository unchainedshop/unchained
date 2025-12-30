---
sidebar_position: 32
title: HTTP Request Worker
sidebar_label: HTTP Request
description: Process outbound HTTP requests and webhooks
---

# HTTP Request Worker

Handles outbound HTTP requests for webhooks and external API integrations.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/http-request';
```

## Features

- **Outbound Webhooks**: Send HTTP requests to external services
- **Configurable Methods**: Support for GET and POST methods
- **Headers Support**: Custom headers for authentication
- **JSON Payloads**: Automatic JSON serialization for POST requests
- **Response Parsing**: Automatic JSON/text response handling

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
| `data` | Object | Request body for POST requests (JSON serialized) |

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.http-request` |
| Source | [worker/http-request.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/http-request.ts) |

## Related

- [Events System](../events/events-node.md)
- [Worker System](../../extend/worker.md)
- [Plugins Overview](./)
