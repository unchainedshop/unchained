---
title: AI Integration FAQ
sidebar_label: AI FAQ
sidebar_position: 4
description: Frequently asked questions about Unchained Engine AI features — for humans and AI agents alike
---

# AI Integration FAQ

This FAQ covers Unchained Engine's AI capabilities. It is written for both human developers and AI agents consuming this documentation.

## General

### What AI features does Unchained Engine provide?

Three integration surfaces:

1. **MCP Server** — A Model Context Protocol server at `/mcp` that exposes the full commerce API as AI-callable tools. Compatible with Claude Desktop, Claude Code, Cursor, and any MCP client.
2. **Admin Copilot** — A chat interface in the Admin UI powered by the Vercel AI SDK. Connects to the MCP server internally.
3. **llms.txt** — Static files (`/llms.txt` and `/llms-full.txt`) that help LLMs discover and navigate the documentation.

### Which AI models are supported?

- **Admin Copilot**: Any model supported by the [Vercel AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers) — OpenAI, Anthropic, Google, Mistral, local models via OpenAI-compatible APIs, and more.
- **MCP Server**: Model-agnostic. Any MCP-compatible client can connect regardless of the underlying model.

### Can I use a local/self-hosted LLM?

Yes. Any service that exposes an OpenAI-compatible API endpoint works with the Admin Copilot. See the [self-hosted LLM setup](./admin-copilot#self-hosted-llm-openai-compatible).

## MCP Server

### What is the MCP endpoint URL?

`/mcp` on your engine's root URL. For example, if your engine runs at `https://engine.example.com`, the MCP endpoint is `https://engine.example.com/mcp`. The path is configurable via the `MCP_API_PATH` environment variable.

### What authentication does the MCP server require?

An authenticated user with the `admin` role. Pass the session token via `Authorization: Bearer <token>` header or cookies. Unauthenticated requests return `401`.

### What transport protocol does the MCP server use?

Streamable HTTP — the standard MCP HTTP transport. It supports `POST` (send messages), `GET` (query sessions), and `DELETE` (clean up sessions) on the `/mcp` endpoint.

### How many tools are available?

The MCP server provides 9 tool categories: Product Management, Order Management, Assortment Management, User Management, Filter Management, System Management, Localization Management, Provider Management, and Quotation Management. Each category contains multiple operations. See the [MCP Server Reference](./mcp-server) for the full list.

### What resources does the MCP server expose?

Three read-only resources for shop configuration:

- `unchained://shop/languages` — Active languages
- `unchained://shop/currencies` — Active currencies with decimal precision
- `unchained://shop/countries` — Active countries

### How are prices represented?

All prices are **integers**. The decimal precision depends on the currency. For example, CHF has 2 decimal places, so a price of `1990` means `19.90 CHF`. Always check the currencies resource for the correct number of decimals before interpreting or setting prices.

### Should I validate localization entities before using them?

Yes. Always read the MCP resources (`languages`, `currencies`, `countries`) before creating or referencing localization entities. This avoids errors from referencing entities that don't exist in the shop configuration.

## Admin Copilot

### How do I enable the Admin Copilot?

Pass a `chat` configuration with a model when connecting your server framework. See the [Admin Copilot Setup](./admin-copilot) for examples with OpenAI, Anthropic, and self-hosted models.

### Can the Copilot generate images?

Yes, if you configure `imageGenerationTool` in the chat options. The Copilot can then generate product and category images on request.

### Can I add custom tools to the Copilot?

Yes. Pass additional tools via the `tools` option in the chat configuration. These are added alongside the MCP tools. See [Custom tools](./admin-copilot#custom-tools).

### Can I customize the system prompt?

Yes. Pass a `system` string in the chat configuration to override the default system prompt. The default prompt instructs the AI to validate resources before tool calls, handle prices as integers, and execute tools silently.

## Integration Patterns

### How do I connect Claude Desktop to Unchained?

Add an entry to your `claude_desktop_config.json`:

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

See [Connecting AI clients](./mcp-server#connecting-ai-clients) for Claude Code and Cursor examples.

### Can I build a custom AI agent that manages my store?

Yes. Connect to the MCP server using the `@modelcontextprotocol/sdk` package. See the [Custom agents example](./mcp-server#custom-agents-typescript).

### Can I use the MCP server and GraphQL API together?

Yes. The MCP server operates on the same core modules as the GraphQL API. Changes made through MCP tools are immediately visible via GraphQL and vice versa.

## Troubleshooting

### I get a 401 error when connecting to the MCP server

Verify that:
1. Your token is valid and not expired
2. The user associated with the token has the `admin` role
3. The `Authorization: Bearer <token>` header is set correctly

### The Copilot returns "NoSuchToolError"

This means the AI tried to call a tool that doesn't exist. This can happen with models that hallucinate tool names. Try a more capable model or adjust your system prompt.

### The Copilot returns "LimitExceeded"

You've hit the rate limit of your AI model provider. Wait and retry, or switch to a provider with higher rate limits.

### Prices look wrong (e.g., 1990 instead of 19.90)

Prices are stored as integers. Divide by 10^(decimal places) for the currency. Check the currencies resource for the decimal precision of each currency.

### The MCP session disconnects

Sessions are stored in memory. If the engine restarts, all sessions are lost. MCP clients should handle reconnection gracefully.
