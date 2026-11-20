import type { IPlugin } from '@unchainedshop/core';
import {
  createMcpHandler,
  hostHeaderValidationResponse,
  localhostAllowedHostnames,
  localhostAllowedOrigins,
  McpServer,
  originValidationResponse,
} from '@modelcontextprotocol/server';
import { createStorefrontToolContext, type StorefrontMcpTool } from './tool.ts';

export {
  createProductSearchTool,
  searchStorefrontProducts,
  type ProductSearchToolOptions,
} from './search.ts';
export {
  createStorefrontToolContext,
  type StorefrontMcpTool,
  type StorefrontToolContext,
} from './tool.ts';

export interface StorefrontMcpOptions {
  shopName: string;
  tools: readonly StorefrontMcpTool[];
}

export function createStorefrontMcpPlugin({ shopName, tools }: StorefrontMcpOptions): IPlugin {
  if (new Set(tools.map((tool) => tool.name)).size !== tools.length)
    throw new Error('Storefront MCP tool names must be unique');
  const views = new Map<string, NonNullable<StorefrontMcpTool['ui']>>();
  for (const { ui } of tools) {
    if (!ui) continue;
    const existing = views.get(ui.resourceUri);
    if (existing && (existing.html !== ui.html || existing.title !== ui.title)) {
      throw new Error(`Conflicting storefront MCP views for ${ui.resourceUri}`);
    }
    views.set(ui.resourceUri, ui);
  }

  return {
    key: 'shop.unchained.mcp.storefront',
    label: 'Storefront MCP',
    version: '1.0.0',
    routes: [
      {
        method: 'ALL',
        path: '/mcp/storefront',
        handler: async (request, context) => {
          const hostname = new URL(process.env.ROOT_URL || 'http://localhost:4010').hostname;
          const rejected =
            hostHeaderValidationResponse(request, [...localhostAllowedHostnames(), hostname]) ??
            originValidationResponse(request, [...localhostAllowedOrigins(), hostname]);
          if (rejected) return rejected;
          const storefront = createStorefrontToolContext(context);
          const handler = createMcpHandler(async () => {
            const server = new McpServer({ name: shopName, version: '1.0.0' });
            for (const [uri, { title, html }] of views) {
              const mimeType = 'text/html;profile=mcp-app';
              server.registerResource(title, uri, { title, mimeType }, () => ({
                contents: [{ uri, mimeType, text: html }],
              }));
            }
            for (const tool of tools) {
              const { handler: call, ...config } = await tool.build(storefront);
              // Forward only validated tool arguments. The SDK's second argument contains raw request metadata.
              server.registerTool(
                tool.name,
                {
                  ...config,
                  ...(tool.ui && {
                    _meta: {
                      ui: { resourceUri: tool.ui.resourceUri },
                      'openai/outputTemplate': tool.ui.resourceUri,
                      'openai/ui': { preferredModelDisplayMode: 'inline' },
                    },
                  }),
                },
                (input) => call(input),
              );
            }
            return server;
          });
          return handler.fetch(request);
        },
      },
    ],
  };
}
