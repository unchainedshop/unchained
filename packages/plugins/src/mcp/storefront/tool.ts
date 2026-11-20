import type { PluginHttpRequestContext } from '@unchainedshop/core';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/server';
import type { z } from 'zod';

export type StorefrontToolContext = Pick<
  PluginHttpRequestContext,
  'modules' | 'services' | 'locale' | 'countryCode' | 'currencyCode'
> & {
  hasPermission(action: string, params?: Record<string, unknown>): Promise<boolean>;
};

type Awaitable<T> = T | Promise<T>;

export interface StorefrontMcpTool<Schema extends z.ZodObject = z.ZodObject> {
  name: string;
  /** HTML view for hosts that render MCP Apps. Tools can share the same resource. */
  ui?: { resourceUri: `ui://${string}`; title: string; html: string };
  build(context: StorefrontToolContext): Awaitable<{
    title?: string;
    description: string;
    inputSchema: Schema;
    outputSchema?: z.ZodObject;
    annotations?: ToolAnnotations;
    handler(input: z.output<Schema>): Awaitable<CallToolResult>;
  }>;
}

/** Create the same guest permission context for a custom tool or a linked storefront page. */
export function createStorefrontToolContext(context: PluginHttpRequestContext): StorefrontToolContext {
  const { modules, services, locale, countryCode, currencyCode, remoteAddress, remotePort, roles } =
    context;
  const market = { modules, services, locale, countryCode, currencyCode };
  const guest = {
    ...market,
    userId: undefined,
    remoteAddress,
    remotePort,
    getHeader: (name: string) =>
      ['accept-language', 'x-shop-country'].includes(name.toLowerCase())
        ? context.getHeader(name)
        : undefined,
  };
  return {
    ...market,
    hasPermission: async (action, params = {}) =>
      (await roles?.userHasPermission(guest, action, [undefined, params])) === true,
  };
}
