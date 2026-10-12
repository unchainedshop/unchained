import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { YogaServerInstance } from 'graphql-yoga';
import { createLogger } from '@unchainedshop/logger';
import type { Context } from '../context.ts';
import { createEndpoints, internalServerError, type ConnectOptions } from '../http/createEndpoints.ts';
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
    unchainedContext: Context | null;
  }
  interface FastifyContextConfig {
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
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.is404 || request.routeOptions.config.unchainedContext === false) return;
    const getHeader = (name: string) => getNodeHeader(request.raw, name);
    if (corsHeaders) reply.headers(corsHeaders(getHeader));
    try {
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
    } catch (error) {
      return reply.send(internalServerError(request.method, request.url, error));
    }
  });
  fastify.addHook('preHandler', (request, reply, done) => {
    if (request.unchainedContext) withAuditContext(request.unchainedContext, done);
    else done();
  });

  fastify.register(async (engine) => {
    engine.route({
      url: yoga.graphqlEndpoint,
      method: ['GET', 'HEAD', 'POST', 'OPTIONS'],
      handler: (request, reply) =>
        yoga.handleNodeRequestAndResponse(request, reply, { req: request, reply }),
    });

    engine.register(async (routesReadingRawBodies) => {
      routesReadingRawBodies.removeAllContentTypeParsers();
      routesReadingRawBodies.addContentTypeParser('*', (request, payload, done) => done(null, payload));
      for (const { path, methods, handler } of routes) {
        routesReadingRawBodies.route({
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
              (reply as any).cspNonce?.script,
            )) ?? reply.callNotFound(),
        });
      }
    }
  });
};
