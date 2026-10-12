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
  /** Development only: lets remote tools (e.g. a GraphQL sandbox) call the API on localhost with cookies */
  allowRemoteToLocalhostSecureCookies?: boolean;
  /** Serve the Admin UI: true, or an options object */
  adminUI?: boolean | AdminUIOptions;
  /** AI chat endpoint (Vercel AI SDK model instances) */
  chat?: ChatConfiguration;
  /** OIDC/OAuth authentication configuration */
  authConfig?: AuthConfig;
  /**
   * SECURITY: Enable this ONLY if behind a properly configured reverse proxy
   * that strips/validates x-forwarded-for and x-real-ip headers from untrusted sources
   */
  trustProxy?: boolean;
}

/** An endpoint besides GraphQL and the Admin UI: MCP, the AI chat or a plugin route */
export interface EngineRoute {
  /** Literal segments and `:name` parameters */
  path: string;
  /** The methods it answers, HEAD along with GET */
  methods: string[];
  handler: (request: Request, context: Context, params: Record<string, string>) => Promise<Response>;
}

export const ALL_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

// Lets remote tools such as a GraphQL sandbox call a development engine with cookies
const devCorsHeaders = (getHeader: (name: string) => string | undefined) => ({
  'access-control-allow-private-network': 'true',
  'access-control-allow-origin': getHeader('origin') || '*',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': getHeader('access-control-request-headers') || '*',
});

// A failing endpoint answers without details, the log gets them
const withErrorResponse = ({ path, methods, handler }: EngineRoute): EngineRoute => ({
  path,
  methods,
  handler: async (request, context, params) => {
    try {
      return await handler(request, context, params);
    } catch (error) {
      logger.error(`${request.method} ${path} failed`, {
        error: error instanceof Error ? error.stack : String(error),
      });
      return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  },
});

/**
 * The engine's HTTP endpoints, which the fetch handler and the server adapters serve: GraphQL, the
 * routes of MCP, the AI chat, the plugins and the OIDC back-channel logout as WHATWG handlers, the
 * Admin UI and the request context.
 */
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
    // SECURITY: This mode is for development only
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
    // Plugin routes get the path parameters in their context
    ...pluginRoutes.map(({ path, method, handler }): EngineRoute => ({
      path,
      methods: method === 'ALL' ? ALL_METHODS : method === 'GET' ? ['GET', 'HEAD'] : [method],
      handler: async (request, context, params) => handler(request, { ...context, params }),
    })),
  ].map(withErrorResponse);

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
