import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { YogaServerInstance } from 'graphql-yoga';
import { createLogger } from '@unchainedshop/logger';
import type { Context } from '../context.ts';
import { createEndpoints, type ConnectOptions } from '../http/createEndpoints.ts';
import { withAuditContext } from '../http/createRequestContext.ts';
import { getNodeHeader, toWebRequest } from '../http/nodeHttpBridge.ts';

export type { ConnectOptions } from '../http/createEndpoints.ts';
export type { AdminUIOptions } from '../http/createAdminUIHandler.ts';
export type {
  AdminUIPluginConfig,
  AdminUIPluginEntityConfig,
  AdminUIPluginPageConfig,
  AdminUIPluginTabConfig,
  AdminUIPluginWidgetConfig,
  AdminUIPluginSlotConfig,
  AdminUIThemeTokens,
  AdminUIThemeConfig,
} from '../adminUiPlugins.ts';

declare module 'fastify' {
  interface FastifyRequest {
    /** The engine's request context, null for requests without a route and the Admin UI's */
    unchainedContext: Context | null;
  }
  interface FastifyContextConfig {
    /** false: the requests of the route get no request context */
    unchainedContext?: boolean;
  }
}

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

/**
 * Serves the engine's endpoints as routes of a Fastify instance, so the hooks of the app and of its
 * plugins apply to them. GraphQL gets its body from Fastify's parsers (`bodyLimit`, 415 for other
 * content types), MCP, chat and plugin routes read it as sent. The routes of the app get the
 * request context as `request.unchainedContext` and take precedence over the Admin UI.
 */
export const connect = async (
  fastify: FastifyInstance,
  platform: { graphqlHandler: YogaServerInstance<any, any> },
  options: ConnectOptions = {},
) => {
  const {
    graphqlHandler: yoga,
    routes,
    serveAdminUI,
    createContext,
    corsHeaders,
  } = createEndpoints(platform, options);

  fastify.decorateRequest('unchainedContext', null);
  // The request context of every route, the engine's and the app's, but the Admin UI's
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.is404 || request.routeOptions.config.unchainedContext === false) return;
    const getHeader = (name: string) => getNodeHeader(request.raw, name);
    if (corsHeaders) reply.headers(corsHeaders(getHeader));
    request.unchainedContext = await createContext(
      {
        getHeader,
        setHeader: (name, value) => reply.header(name, value),
        appendHeader: (name, value) => reply.header(name, value),
        remoteAddress: request.socket.remoteAddress,
        remotePort: request.socket.remotePort,
      },
      request,
      reply,
    );
  });
  // Handlers run as the user of the request, from preHandler as body parsing leaves the async
  // context of onRequest
  fastify.addHook('preHandler', (request, reply, done) => {
    if (request.unchainedContext) withAuditContext(request.unchainedContext, done);
    else done();
  });

  // As a plugin, the routes come after the plugins registered before, so hooks those add to every
  // route, like the ones of @fastify/rate-limit, apply to them too. HEAD is listed: the HEAD routes
  // Fastify derives from GET routes cannot send a web Response.
  fastify.register(async (engine) => {
    // GraphQL Yoga's Fastify integration
    engine.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'HEAD', 'POST', 'OPTIONS'],
      handler: (request, reply) =>
        yoga.handleNodeRequestAndResponse(request, reply, { req: request, reply }),
    });

    engine.register(async (endpoints) => {
      // MCP, the chat and plugin routes read their bodies as sent
      endpoints.removeAllContentTypeParsers();
      endpoints.addContentTypeParser('*', (request, payload, done) => done(null, payload));
      for (const { path, methods, handler } of routes) {
        endpoints.route({
          url: path,
          method: methods,
          handler: (request, reply) =>
            handler(
              toWebRequest(request.raw, reply.raw, { protocol: request.protocol, body: request.body }),
              request.unchainedContext!,
              request.params as Record<string, string>,
            ),
        });
      }
    });

    if (serveAdminUI) {
      const { basePath, assetPaths } = serveAdminUI;
      for (const url of basePath ? [basePath, `${basePath}/*`, ...assetPaths] : ['/*']) {
        engine.route({
          url,
          method: ['GET', 'HEAD'],
          config: { unchainedContext: false },
          handler: async (request, reply) =>
            (await serveAdminUI(
              toWebRequest(request.raw, reply.raw, { protocol: request.protocol }),
              // CSP nonce convention of @fastify/helmet with enableCSPNonces
              (reply as any).cspNonce?.script,
            )) ?? reply.callNotFound(),
        });
      }
    }
  });
};
