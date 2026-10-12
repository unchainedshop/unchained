import type { YogaServerInstance } from 'graphql-yoga';
import {
  ALL_METHODS,
  createEndpoints,
  internalServerError,
  type ConnectOptions,
  type EngineRoute,
} from './createEndpoints.ts';
import { withAuditContext } from './createRequestContext.ts';

export type { ConnectOptions } from './createEndpoints.ts';

export interface ServerContext {
  remoteAddress?: string;
  remotePort?: number;
  cspNonce?: string;
  req?: unknown;
  res?: unknown;
}

const matchPath = (path: string, pathname: string) => {
  const segments = path.split('/');
  const parts = pathname.split('/');
  const hasTrailingSlash = parts.length === segments.length + 1 && !parts.at(-1);
  if (hasTrailingSlash) parts.pop();
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
    return undefined;
  }
  return params;
};

const withContextHeaders = (response: Response, contextHeaders: Headers): Response => {
  const merge = (headers: Headers) => {
    for (const [name, value] of contextHeaders) {
      if (name === 'set-cookie') headers.append(name, value);
      else if (!headers.has(name)) headers.set(name, value);
    }
  };
  try {
    merge(response.headers);
    return response;
  } catch {
    const mutableCopy = new Response(response.body, response);
    merge(mutableCopy.headers);
    return mutableCopy;
  }
};

export const createFetchHandler = (
  platform: { graphqlHandler: YogaServerInstance<any, any> },
  options?: ConnectOptions,
) => {
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
  const engineRoutes = [graphql, ...routes];

  const findRoute = (method: string, pathname: string) => {
    for (const route of engineRoutes) {
      const params = route.methods.includes(method) && matchPath(route.path, pathname);
      if (params) return { route, params };
    }
    return undefined;
  };

  return async (request: Request, server: ServerContext = {}): Promise<Response | undefined> => {
    const matched = findRoute(request.method, new URL(request.url).pathname);
    if (!matched) return serveAdminUI?.(request, server.cspNonce);

    const getHeader = (name: string) => request.headers.get(name) ?? undefined;
    const contextHeaders = new Headers(corsHeaders?.(getHeader));
    try {
      const context = await createContext(
        {
          getHeader,
          setHeader: (name, value) => contextHeaders.set(name, value),
          appendHeader: (name, value) => contextHeaders.append(name, value),
          remoteAddress: server.remoteAddress,
          remotePort: server.remotePort,
        },
        server.req,
        server.res,
      );
      const response = await withAuditContext(context, () =>
        matched.route.handler(request, context, matched.params),
      );
      return withContextHeaders(response, contextHeaders);
    } catch (error) {
      return internalServerError(request, error);
    }
  };
};
