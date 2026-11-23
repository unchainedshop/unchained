import type { McpServer } from '@modelcontextprotocol/server';
import type { Context } from '@unchainedshop/api';
import { createMcpHttpHandler } from '@unchainedshop/api/mcp';
import type { IPlugin } from '@unchainedshop/core';

export { createProductSearchTool, searchStorefrontProducts } from './search.ts';
export { resolveStorefrontMarket } from './market.ts';
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

  const serveStorefrontMcp = createMcpHttpHandler(
    { name: shopName, version: '1.0.0' },
    async (server, context) => {
      for (const { uri, html, csp } of views) {
        const meta = csp && { _meta: { ui: { csp } } };
        server.registerResource(uri, uri, { mimeType: MCP_APP_MIME_TYPE, ...meta }, async () => ({
          contents: [{ uri, mimeType: MCP_APP_MIME_TYPE, text: html, ...meta }],
        }));
      }
      for (const tool of tools) await tool.register(server, context);
    },
    { maxSubscriptions: 0, allowedHostnames: shopUrl ? [new URL(shopUrl).hostname] : [] },
  );

  return {
    key: 'shop.unchained.mcp.storefront',
    label: 'Storefront MCP',
    version: '1.0.0',
    routes: [
      {
        path: '/mcp/storefront',
        method: 'ALL',
        handler: (request, context) => serveStorefrontMcp(request, context as unknown as Context),
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
