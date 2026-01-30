import { getCurrentContextResolver } from '../context.ts';
import { createAuthContext, type AuthContextParams } from '../middleware/createAuthMiddleware.ts';
import type { AuthConfig } from '../auth.ts';
import type { YogaServerInstance } from 'graphql-yoga';
import type { UnchainedCore } from '@unchainedshop/core';
import { pluginRegistry } from '@unchainedshop/core';
import fastifyCookie from '@fastify/cookie';
import type { FastifyBaseLogger, FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createLogger } from '@unchainedshop/logger';
import mcpHandler from './mcpHandler.ts';
import { connectChat } from './chatHandler.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { mountRoutes } from './mountRoutes.ts';
import { readFileSync } from 'node:fs';
import { createBackchannelLogoutRoute } from '../handlers/createBackchannelLogoutHandler.ts';

export interface AdminUIRouterOptions {
  prefix: string;
  enabled?: boolean;
}

/**
 * Resolve the user's remote address
 * SECURITY: Proxy headers (x-forwarded-for, x-real-ip) can be spoofed unless:
 * - The application is behind a properly configured reverse proxy
 * - The proxy strips/validates these headers from untrusted sources
 * When trustProxy is false, we only use the socket's remote address
 */
const resolveUserRemoteAddress = (req: FastifyRequest, trustProxy = false) => {
  let remoteAddress: string | undefined;

  if (trustProxy) {
    // Only trust proxy headers when explicitly enabled
    // Per RFC 7239: use the LAST IP in X-Forwarded-For as it's the one added by our trusted proxy
    // Earlier IPs in the chain can be spoofed by malicious clients
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    const forwardedIps = forwardedFor?.split(',').map((ip) => ip.trim());
    remoteAddress =
      (req.headers['x-real-ip'] as string) ||
      forwardedIps?.[forwardedIps.length - 1] ||
      req.socket?.remoteAddress;
  } else {
    // Default: only use socket address (cannot be spoofed)
    remoteAddress = req.socket?.remoteAddress;
  }

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const { MCP_API_PATH = '/mcp', GRAPHQL_API_PATH = '/graphql' } = process.env;

const createMiddlewareHook = (authConfig?: AuthConfig, trustProxy = false) =>
  async function middlewareHook(req: any, reply: any) {
    const setHeader = (key: string, value: string) => reply.header(key, value);
    const getHeader = (key: string) => req.headers[key];
    const getCookie = (name: string) => req.cookies?.[name];
    const setCookie = (name: string, value: string, options: any) =>
      reply.setCookie(name, value, options);
    const clearCookie = (name: string, options: any) =>
      reply.clearCookie(name, { ...options, maxAge: 0 });
    const { remoteAddress, remotePort } = resolveUserRemoteAddress(req, trustProxy);

    const authContextParams: AuthContextParams = {
      setHeader,
      getHeader,
      getCookie,
      setCookie,
      clearCookie,
      remoteAddress,
      remotePort,
    };

    // Create auth context (handles JWT verification and login/logout functions)
    const authContext = await createAuthContext(authContextParams, authConfig);

    // Get the context resolver
    const context = getCurrentContextResolver();

    // Build full context
    (req as any).unchainedContext = await context(
      {
        setHeader,
        getHeader,
        remoteAddress,
        remotePort,
        login: authContext.login,
        logout: authContext.logout,
        accessToken: authContext.accessToken,
        userId: authContext.userId,
        impersonatorId: authContext.impersonatorId,
        tokenVersion: authContext.tokenVersion,
      },
      req,
      reply,
    );
  };

export const unchainedLogger = (prefix: string): FastifyBaseLogger => {
  const logger = createLogger(prefix);
  function Logger(...args: any[]) {
    (this as any).args = args;
  }
  Logger.prototype.info = logger.info;
  Logger.prototype.error = logger.error;
  Logger.prototype.debug = logger.debug;
  Logger.prototype.fatal = logger.error;
  Logger.prototype.warn = logger.warn;
  Logger.prototype.trace = logger.trace;
  Logger.prototype.child = function () {
    return new Logger();
  };
  return new (Logger as any)();
};

export const connect = async (
  fastify: FastifyInstance,
  {
    graphqlHandler,
    unchainedAPI,
  }: {
    graphqlHandler: YogaServerInstance<any, any>;
    unchainedAPI: UnchainedCore;
  },
  {
    allowRemoteToLocalhostSecureCookies = false,
    adminUI = false,
    chat,
    authConfig,
    trustProxy = false,
  }: {
    allowRemoteToLocalhostSecureCookies?: boolean;
    adminUI?: boolean | Omit<AdminUIRouterOptions, 'enabled'>;
    chat?: ChatConfiguration;
    authConfig?: AuthConfig;
    /** SECURITY: Enable this ONLY if behind a properly configured reverse proxy
     * that strips/validates x-forwarded-for and x-real-ip headers from untrusted sources */
    trustProxy?: boolean;
  } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    // SECURITY: This mode is for development only - block in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'allowRemoteToLocalhostSecureCookies is not allowed in production. ' +
          'Configure a proper CORS policy with specific allowed origins instead.',
      );
    }

    // Workaround: Allow to use sandbox with localhost (development only)
    // https://github.com/fastify/fastify-cookie/issues/308
    fastify.addHook('preHandler', async function (request) {
      request.headers['x-forwarded-proto'] = 'https';
    });
    fastify.addHook('onSend', async function (req, reply) {
      reply.headers({
        'Access-Control-Allow-Private-Network': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].join(', '),
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
      });
    });
  }

  // Register cookie plugin for JWT cookie handling
  if (!fastify.hasPlugin('@fastify/cookie')) {
    fastify.register(fastifyCookie);
  }

  fastify.decorateRequest('unchainedContext');
  // Note: allowRemoteToLocalhostSecureCookies implies trustProxy for dev convenience
  fastify.addHook(
    'onRequest',
    createMiddlewareHook(authConfig, trustProxy || allowRemoteToLocalhostSecureCookies),
  );


  fastify.route({
    url: graphqlHandler.graphqlEndpoint,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      // Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
      return graphqlHandler.handleNodeRequestAndResponse(req, reply, {
        req,
        reply,
      });
    },
  });

  // MCP endpoint (remains framework-specific due to SDK requirements)
  fastify.route({
    url: MCP_API_PATH,
    method: ['GET', 'POST', 'DELETE'],
    handler: mcpHandler,
  });

  if (chat) {
    connectChat(fastify, chat);
  }

  // Collect all routes: plugin routes + backchannel logout (if OIDC configured)
  const routes = pluginRegistry.getRoutes();

  if (authConfig?.oidcProviders?.length) {
    routes.push(createBackchannelLogoutRoute(authConfig.oidcProviders));
  }

  // Mount all routes uniformly
  mountRoutes(fastify, unchainedAPI, routes);

  if (adminUI) {
    fastify.register(adminUIRouter, {
      enabled: true,
      prefix: typeof adminUI === 'object' ? adminUI.prefix : '/',
    });
  }
};

const fallbackLandingPageHandler = (request: any, reply: any) => {
  if (request.raw.method === 'GET') {
    try {
      // Try to resolve from package exports first (works in non-bundled environments)
      const staticURL = import.meta.resolve('@unchainedshop/api/index.html');
      const staticPath = new URL(staticURL).pathname;
      return reply.type('text/html').send(readFileSync(staticPath));
    } catch {
      // Fallback for bundled environments: use relative path from this file
      const fallbackPath = new URL('../../index.html', import.meta.url).pathname;
      return reply.type('text/html').send(readFileSync(fallbackPath));
    }
  } else {
    return reply.status(404).send();
  }
};

const resolveAdminUIPath = () => {
  try {
    const staticURL = import.meta.resolve('@unchainedshop/admin-ui');
    return new URL(staticURL).pathname.split('/').slice(0, -1).join('/');
  } catch {
    return null;
  }
};

export const adminUIRouter: FastifyPluginAsync<AdminUIRouterOptions> = async (
  fastify: FastifyInstance,
  opts,
) => {
  try {
    let fastifyStatic;
    try {
      const fastifyStaticModule = await import('@fastify/static');
      fastifyStatic = fastifyStaticModule.default;
    } catch {
      fastify.log.warn("npm dependency @fastify/static is not installed, can't serve admin-ui");
    }

    if (fastifyStatic) {
      const adminUIPath = resolveAdminUIPath();
      if (adminUIPath) {
        await fastify.register(fastifyStatic, {
          root: adminUIPath,
          prefix: opts.prefix || '/',
        });
        return;
      }
    }
    await fastify.get(opts.prefix || '/', fallbackLandingPageHandler);
  } catch (e) {
    fastify.log.error(e);
    if (process.env.NODE_ENV !== 'production') {
      // Trying the default admin ui dev port
      fastify.get('/', async (request, reply) => {
        return reply.redirect('http://localhost:3000');
      });
    }
  }
};

export { connectChat };
