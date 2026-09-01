# MCP Server

This directory contains the Model Context Protocol (MCP) server implementation for Unchained Commerce, built on the MCP TypeScript SDK v2 (`@modelcontextprotocol/server`, an optional peer dependency).

## Architecture

The `/mcp` endpoint is **stateless**: `createMcpHandler` builds a fresh `McpServer` for every HTTP request from that request's authenticated context (passed through `authInfo.extra`). There is no session map — no `Mcp-Session-Id` is issued, `GET`/`DELETE` return `405`, and the endpoint works multi-replica. All auth (401 with OAuth resource metadata, 403 unless the user has the `admin` role, 503 when the optional SDK is missing) and the SDK-required `Host`/browser `Origin` validation happen in `handleMcpHttpRequest.ts` before SDK dispatch. The hostname configured in `ROOT_URL` and localhost aliases are accepted.

## Structure

```
mcp/
├── index.ts                 # Registers all tools + resources onto a McpServer (admin-gated)
├── handleMcpHttpRequest.ts  # Web-standard entrypoint: auth wall, optional-peer guard, createMcpHandler
├── nodeHttpBridge.ts        # Node req/res <-> web Request/Response bridge shared by Express/Fastify
├── resources/               # MCP resources (shop localization) + in-process builders for chat
├── tools/                   # One "<domain>_management" mega-tool per domain (9 total)
│   └── <domain>/
│       ├── index.ts             # registerTool call
│       ├── schemas.ts           # zod action validators + merged input schema
│       ├── <domain>Management.ts # action dispatch with per-action validation
│       └── handlers/            # One handler per action
└── utils/                   # sharedSchemas.ts: schema factory + response helpers
```

## Adding New Tools

1. Create a new domain directory under `tools/` following the pattern above: per-action zod validators in `schemas.ts`, a merged schema via `createManagementSchemaFromValidators`, handlers, and a dispatcher.
2. Register it in `tools/<domain>/index.ts` with `server.registerTool(name, { description, inputSchema }, cb)`.
3. Call the registrar from `mcp/index.ts`.

Schemas are classic-zod raw shapes. `createManagementSchemaFromValidators` merges the per-action validators into one raw shape, which `registerTool` auto-wraps with `z.object()`; zod >= 4.2 natively carries the Standard Schema `~standard.jsonSchema` provider, so the SDK converts schemas with the app's own zod (and without its fallback warning).
