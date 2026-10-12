import type { YogaServerInstance } from 'graphql-yoga';
import { createLogger } from '@unchainedshop/logger';
import {
  ALL_METHODS,
  createEndpoints,
  type ConnectOptions,
  type EngineRoute,
} from './createEndpoints.ts';
import { withAuditContext } from './createRequestContext.ts';

export type { ConnectOptions as FetchHandlerOptions } from './createEndpoints.ts';

const logger = createLogger('unchained:api:http');

/** What the server knows about a request besides the request itself */
export interface ServerContext {
  /** Address and port of the client socket */
  remoteAddress?: string;
  remotePort?: number;
  /** Nonce of the request's Content-Security-Policy, for the import map the Admin UI injects */
  cspNonce?: string;
  /** The server's own request and response, passed on to custom context resolvers */
  req?: unknown;
  res?: unknown;
}

/** Answers the engine's endpoints, undefined for requests that are not the engine's */
export type FetchHandler = (request: Request, server?: ServerContext) => Promise<Response | undefined>;

// Route paths are literal segments and `:name` parameters, a trailing slash is optional
const matchPath = (path: string, pathname: string) => {
  const segments = path.split('/');
  const parts = pathname.split('/');
  if (parts.length === segments.length + 1 && !parts.at(-1)) parts.pop();
  if (parts.length !== segments.length) return undefined;
  const params: Record<string, string> = {};
  try {
    for (const [index, segment] of segments.entries()) {
      if (segment.startsWith(':') && parts[index]) {
        params[segment.slice(1)] = decodeURIComponent(parts[index]);
      } else if (segment !== parts[index]) {
        return undefined;
      }
    }
  } catch {
    return undefined; // malformed percent-encoding
  }
  return params;
};

// Headers set through the context are defaults of the response, Set-Cookie fields add up
const withHeaders = (response: Response, headers: Headers): Response => {
  const merge = (target: Headers) => {
    for (const [name, value] of headers) {
      if (name === 'set-cookie') target.append(name, value);
      else if (!target.has(name)) target.set(name, value);
    }
  };
  try {
    merge(response.headers);
    return response;
  } catch {
    // Immutable headers, e.g. of Response.redirect()
    const copy = new Response(response.body, response);
    merge(copy.headers);
    return copy;
  }
};

/**
 * The engine's HTTP endpoints as one WHATWG fetch handler, e.g. for Bun and Deno: GraphQL, MCP,
 * the AI chat, the plugin routes and the Admin UI.
 */
export const createFetchHandler = (
  platform: { graphqlHandler: YogaServerInstance<any, any> },
  options?: ConnectOptions,
): FetchHandler => {
  const { graphqlHandler, routes, serveAdminUI, createContext, corsHeaders } = createEndpoints(
    platform,
    options,
  );
  const graphql: EngineRoute = {
    path: graphqlHandler.graphqlEndpoint,
    methods: ALL_METHODS,
    handler: async (request, unchainedContext) =>
      graphqlHandler.handleRequest(request, { unchainedContext }),
  };

  const findRoute = (method: string, pathname: string) => {
    for (const route of [graphql, ...routes]) {
      const params = route.methods.includes(method) ? matchPath(route.path, pathname) : undefined;
      if (params) return { route, params };
    }
    return undefined;
  };

  return async (request, server = {}) => {
    const { pathname } = new URL(request.url);
    const matched = findRoute(request.method, pathname);
    if (!matched) return serveAdminUI?.(request, server.cspNonce);

    const getHeader = (name: string) => request.headers.get(name) ?? undefined;
    const headers = new Headers(corsHeaders?.(getHeader));
    try {
      const context = await createContext(
        {
          getHeader,
          setHeader: (name, value) => headers.set(name, value),
          appendHeader: (name, value) => headers.append(name, value),
          remoteAddress: server.remoteAddress,
          remotePort: server.remotePort,
        },
        server.req,
        server.res,
      );
      const response = await withAuditContext(context, () =>
        matched.route.handler(request, context, matched.params),
      );
      return withHeaders(response, headers);
    } catch (error) {
      logger.error(`${request.method} ${pathname} failed`, {
        error: error instanceof Error ? error.stack : String(error),
      });
      return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  };
};
