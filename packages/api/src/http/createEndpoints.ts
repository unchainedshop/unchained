import type { YogaServerInstance } from 'graphql-yoga';
import { pluginRegistry } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import type { AuthConfig } from '../auth.ts';
import { createChatHandler } from '../chat/createChatHandler.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import type { Context } from '../context.ts';
import { createBackchannelLogoutRoute } from '../handlers/createBackchannelLogoutHandler.ts';
import handleMcpHttpRequest from '../mcp/handleMcpHttpRequest.ts';
import { createAdminUIHandler, type AdminUIOptions } from './createAdminUIHandler.ts';
import { createRequestContext, type RequestContextParams } from './createRequestContext.ts';

const logger = createLogger('unchained:api:http');

export interface ConnectOptions {
  allowRemoteToLocalhostSecureCookies?: boolean;
  adminUI?: boolean | AdminUIOptions;
  chat?: ChatConfiguration;
  authConfig?: AuthConfig;
  trustProxy?: boolean;
}

export interface EngineRoute {
  path: string;
  methods: string[];
  handler: (request: Request, context: Context, params: Record<string, string>) => Promise<Response>;
}

export const ALL_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

export const internalServerError = (request: Request, error: unknown) => {
  logger.error(`${request.method} ${new URL(request.url).pathname} failed`, {
    error: error instanceof Error ? error.stack : String(error),
  });
  return Response.json({ error: 'Internal Server Error' }, { status: 500 });
};

const withInternalServerError = ({ handler, ...route }: EngineRoute): EngineRoute => ({
  ...route,
  handler: (request, context, params) =>
    handler(request, context, params).catch((error) => internalServerError(request, error)),
});

const devCorsHeaders = (getHeader: (name: string) => string | undefined) => ({
  'access-control-allow-private-network': 'true',
  'access-control-allow-origin': getHeader('origin') || '*',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': getHeader('access-control-request-headers') || '*',
});

export const createEndpoints = (
  { graphqlHandler }: { graphqlHandler: YogaServerInstance<any, any> },
  {
    allowRemoteToLocalhostSecureCookies = false,
    adminUI = false,
    chat,
    authConfig,
    trustProxy = false,
  }: ConnectOptions = {},
) => {
  if (allowRemoteToLocalhostSecureCookies && process.env.NODE_ENV === 'production') {
    throw new Error(
      'allowRemoteToLocalhostSecureCookies is not allowed in production. ' +
        'Configure a proper CORS policy with specific allowed origins instead.',
    );
  }

  const { MCP_API_PATH = '/mcp' } = process.env;
  const chatHandler = chat && createChatHandler(chat);
  const pluginRoutes = [
    ...pluginRegistry.getRoutes(),
    ...(authConfig?.oidcProviders?.length
      ? [createBackchannelLogoutRoute(authConfig.oidcProviders)]
      : []),
  ];
  if (pluginRoutes.length) {
    logger.info(
      `Plugin routes: ${pluginRoutes.map(({ method, path }) => `${method} ${path}`).join(', ')}`,
    );
  }

  const routes: EngineRoute[] = [
    {
      path: MCP_API_PATH,
      methods: ALL_METHODS,
      handler: async (request, context) => handleMcpHttpRequest(context, request),
    },
    ...(chatHandler
      ? [
          { path: '/chat', methods: ['POST', 'OPTIONS'], handler: chatHandler },
          { path: '/chat/tools', methods: ['GET', 'HEAD', 'OPTIONS'], handler: chatHandler },
        ]
      : []),
    ...pluginRoutes.map(({ path, method, handler }): EngineRoute => ({
      path,
      methods: method === 'ALL' ? ALL_METHODS : method === 'GET' ? ['GET', 'HEAD'] : [method],
      handler: async (request, context, params) => handler(request, { ...context, params }),
    })),
  ].map(withInternalServerError);

  const contextOptions = { authConfig, trustProxy: trustProxy || allowRemoteToLocalhostSecureCookies };
  return {
    graphqlHandler,
    routes,
    serveAdminUI: adminUI ? createAdminUIHandler(adminUI === true ? {} : adminUI) : undefined,
    createContext: (params: RequestContextParams, req?: unknown, res?: unknown) =>
      createRequestContext(params, contextOptions, req, res),
    corsHeaders: allowRemoteToLocalhostSecureCookies ? devCorsHeaders : undefined,
  };
};
