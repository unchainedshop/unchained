import { createMcpHandler, McpServer, type McpHttpHandler } from '@modelcontextprotocol/server';
import type { Context } from '@unchainedshop/api';
import type { IPlugin } from '@unchainedshop/core';
import { createSearchInputIndex } from './exposure.ts';

export { createProductSearchTool, searchStorefrontProducts } from './search.ts';
export { resolveStorefrontMarket } from './market.ts';
export { storefrontMcpTypeDefs, storefrontMcpResolvers } from './exposure.ts';
export { storefrontMcpAdminPlugin } from './admin-plugin.ts';
export type { ProductUrlBuilder } from './results.ts';

const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app';

export interface StorefrontMcpView {
  uri: string;
  html: string;
  csp?: Record<string, string[]>;
}

export interface StorefrontMcpTool {
  ui?: StorefrontMcpView;
  register: (server: McpServer, context: Context) => Promise<void>;
}

const storefrontMcpUrl = () =>
  `${(process.env.ROOT_URL || 'http://localhost:4010').replace(/\/$/, '')}/mcp/storefront`;

export function createStorefrontMcpPlugin({
  shopName,
  shopUrl,
  tools,
}: {
  shopName: string;
  shopUrl?: string;
  tools: StorefrontMcpTool[];
}): IPlugin {
  const views = [...new Map(tools.flatMap(({ ui }) => (ui ? [[ui.uri, ui] as const] : []))).values()];

  const createServer = async (context: Context) => {
    const server = new McpServer({ name: shopName, version: '1.0.0' });
    for (const { uri, html, csp } of views) {
      const meta = csp && { _meta: { ui: { csp } } };
      server.registerResource(uri, uri, { mimeType: MCP_APP_MIME_TYPE, ...meta }, async () => ({
        contents: [{ uri, mimeType: MCP_APP_MIME_TYPE, text: html, ...meta }],
      }));
    }
    for (const tool of tools) await tool.register(server, context);
    return server;
  };

  let handler: McpHttpHandler | undefined;
  const handleMcpRequest = (request: Request, context: Context) => {
    handler ??= createMcpHandler(
      async ({ authInfo }) => createServer((authInfo!.extra as { context: Context }).context),
      { maxSubscriptions: 0 },
    );
    return handler.fetch(request, {
      authInfo: {
        token: 'unchained-context',
        clientId: context.userId ?? 'anonymous',
        scopes: [],
        extra: { context },
      },
    });
  };

  return {
    key: 'shop.unchained.mcp.storefront',
    label: 'Storefront MCP',
    version: '1.0.0',
    module: ({ db }) => ({ storefrontMcp: createSearchInputIndex(db) }),
    routes: [
      {
        path: '/mcp/storefront',
        method: 'ALL',
        handler: (request, context) => handleMcpRequest(request, context as unknown as Context),
      },
      ...(shopUrl
        ? [
            {
              path: '/.well-known/ocp.json',
              method: 'GET' as const,
              handler: async () =>
                Response.json({
                  version: '1.0',
                  merchant: { name: shopName, url: shopUrl },
                  bridge: { mcp: storefrontMcpUrl() },
                }),
            },
          ]
        : []),
    ],
  };
}

export default createStorefrontMcpPlugin;
