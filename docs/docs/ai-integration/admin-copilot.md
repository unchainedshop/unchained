---
title: Admin Copilot Setup
description: Set up and use the AI Copilot in the Unchained Admin UI to manage products, orders, and store configuration with natural language.
sidebar_label: Admin Copilot
sidebar_position: 3
---

# Admin Copilot

The Admin UI includes a built-in AI Copilot that can manage products, orders, users, and more through natural language. It connects to the [MCP server](./mcp-server) internally, so all MCP tools are available to the Copilot.

## How it works

The Copilot exposes two HTTP endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat` | POST | Stream AI responses with tool execution |
| `/chat/tools` | GET | List available tools and their schemas |

The Chat API uses the [Vercel AI SDK](https://ai-sdk.dev/) to stream responses. It connects to the MCP server internally to execute tools on behalf of the user.

## Setup

To enable the Copilot, pass a `chat` configuration when connecting your server framework. You need to install a model provider from the [AI SDK providers list](https://ai-sdk.dev/providers/ai-sdk-providers).

### Self-hosted LLM (OpenAI-compatible)

If you have a machine with at least 24 GB of VRAM, you can run an LLM locally. Any service exposing an OpenAI-compatible API will work:

```bash
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
export OPENAI_COMPAT_API_URL=http://127.0.0.1:8080/v1
export OPENAI_COMPAT_MODEL=gpt-oss
```

```typescript
import { connect } from '@unchainedshop/api/fastify';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// ... after creating fastify instance and unchained platform ...

if (process.env.OPENAI_COMPAT_API_URL && process.env.OPENAI_COMPAT_MODEL) {
  const provider = createOpenAICompatible({
    name: 'local',
    baseURL: process.env.OPENAI_COMPAT_API_URL,
  });
  connect(fastify, engine, {
    chat: {
      model: provider.chatModel(process.env.OPENAI_COMPAT_MODEL),
    },
  });
}
```

### OpenAI

```typescript
import { connect } from '@unchainedshop/api/fastify';
import { openai } from '@ai-sdk/openai';

// ... after creating fastify instance and unchained platform ...

if (process.env.OPENAI_API_KEY) {
  connect(fastify, engine, {
    chat: {
      model: openai('gpt-4-turbo'),
      imageGenerationTool: { model: openai.image('gpt-image-1') },
    },
  });
}
```

With `imageGenerationTool` enabled, the Copilot can generate product and category images.

### Anthropic

```typescript
import { connect } from '@unchainedshop/api/fastify';
import { anthropic } from '@ai-sdk/anthropic';

if (process.env.ANTHROPIC_API_KEY) {
  connect(fastify, engine, {
    chat: {
      model: anthropic('claude-sonnet-4-20250514'),
    },
  });
}
```

## Configuration options

The `chat` object extends the Vercel AI SDK's `streamText` parameters (minus `messages`), so all [streamText options](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) are supported. The most commonly used options are:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `model` | `LanguageModelV1` | Yes | AI model instance from any Vercel AI SDK provider |
| `system` | `string` | No | Custom system prompt (a sensible default is built in) |
| `tools` | `Record<string, Tool>` | No | Additional custom tools beyond MCP tools |
| `temperature` | `number` | No | Model temperature (default: `0.2`) |
| `maxRetries` | `number` | No | Retry count on failure (default: `3`) |
| `unchainedMCPUrl` | `string` | No | MCP server URL, defaults to `${ROOT_URL}/mcp` |
| `imageGenerationTool` | `{ model, uploadUrl? }` | No | Enable image generation in the Copilot |

### Image generation

When `imageGenerationTool` is configured, a `generateImage` tool becomes available in the Copilot. It supports these sizes:

`512x512`, `768x768`, `1024x1024`, `512x896`, `640x1120`, `768x1344`, `1024x1792`, `896x512`, `1120x640`, `1344x768`, `1792x1024`

Generated images are automatically uploaded to the engine's temporary upload endpoint and can be attached to products or categories.

### Custom tools

You can extend the Copilot with additional tools:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

connect(fastify, engine, {
  chat: {
    model: openai('gpt-4-turbo'),
    tools: {
      checkInventory: tool({
        description: 'Check real-time inventory for a SKU',
        parameters: z.object({ sku: z.string() }),
        execute: async ({ sku }) => {
          // Your inventory check logic
          return { sku, available: 42 };
        },
      }),
    },
  },
});
```

## Chat API details

### POST /chat

Streams AI responses with automatic tool execution.

**Request body:**

```json
{
  "messages": [
    { "role": "user", "content": "List the top 5 products by revenue" }
  ]
}
```

**Response:** Server-sent events stream (Vercel AI SDK UI message format).

The chat handler:
- Keeps the last 10 messages for context
- Executes up to 500 tool calls per request (Fastify) or 10 (Express)
- Uses temperature `0.2` for deterministic responses
- Injects shop configuration (languages, currencies, countries) into the system prompt automatically

### GET /chat/tools

Returns all available tools grouped by category:

```json
{
  "tools": [
    {
      "name": "product_management",
      "description": "...",
      "parameters": { ... },
      "category": "Product Management"
    }
  ],
  "cached": false
}
```
