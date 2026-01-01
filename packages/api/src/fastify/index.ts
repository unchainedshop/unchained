import { getCurrentContextResolver } from '../context.ts';
import {
  createAuthContext,
  defaultCookieConfig,
  type AuthMiddlewareConfig,
} from '../middleware/createAuthMiddleware.ts';
import bulkImportHandler from './bulkImportHandler.ts';
import ercMetadataHandler from './ercMetadataHandler.ts';
import type { YogaServerInstance } from 'graphql-yoga';
import type { UnchainedCore } from '@unchainedshop/core';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import type { FastifyBaseLogger, FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createLogger } from '@unchainedshop/logger';
import mcpHandler from './mcpHandler.ts';
import tempUploadHandler from './tempUploadHandler.ts';
import { connectChat } from './chatHandler.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { readFileSync } from 'node:fs';

export interface AdminUIRouterOptions {
  prefix: string;
  enabled?: boolean;
}

const resolveRemoteAddress = (req: FastifyRequest) => ({
  remoteAddress:
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress,
  remotePort: req.socket?.remotePort,
});

const {
  MCP_API_PATH = '/mcp',
  GRAPHQL_API_PATH = '/graphql',
  BULK_IMPORT_API_PATH = '/bulk-import',
  TEMP_UPLOAD_API_PATH = '/temp-upload',
  ERC_METADATA_API_PATH = '/erc-metadata/:productId/:localeOrTokenFilename/:tokenFileName?',
} = process.env;

const createMiddlewareHook = (config: AuthMiddlewareConfig) =>
  async function middlewareHook(req: any, reply: any) {
    const { remoteAddress, remotePort } = resolveRemoteAddress(req);
    const setHeader = (key: string, value: string) => reply.header(key, value);
    const getHeader = (key: string) => req.headers[key];

    const authContext = await createAuthContext({
      getHeader,
      setHeader,
      getCookie: (name) => req.cookies?.[name],
      setCookie: (name, value, options) => reply.setCookie(name, value, options),
      clearCookie: (name, options) => reply.clearCookie(name, options),
      remoteAddress,
      remotePort,
      config,
    });

    const contextResolver = getCurrentContextResolver();
    (req as any).unchainedContext = await contextResolver(
      { setHeader, getHeader, remoteAddress, remotePort, ...authContext },
      req,
      reply,
    );
  };

export const unchainedLogger = (prefix: string): FastifyBaseLogger => {
  const logger = createLogger(prefix);
  function Logger(...args: any[]) {
    this.args = args;
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
  return new Logger();
};

export const connect = (
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
    initPluginMiddlewares,
    authConfig,
  }: {
    allowRemoteToLocalhostSecureCookies?: boolean;
    adminUI?: boolean | Omit<AdminUIRouterOptions, 'enabled'>;
    chat?: ChatConfiguration;
    initPluginMiddlewares?: (
      app: FastifyInstance,
      { unchainedAPI }: { unchainedAPI: UnchainedCore },
    ) => void;
    authConfig?: Partial<AuthMiddlewareConfig>;
  } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    fastify.addHook('preHandler', async (request) => {
      request.headers['x-forwarded-proto'] = 'https';
    });
    fastify.addHook('onSend', async (req, reply) => {
      reply.headers({
        'Access-Control-Allow-Private-Network': 'true',
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
      });
    });
  }

  const config: AuthMiddlewareConfig = {
    cookie: defaultCookieConfig,
    ...authConfig,
  };

  if (!fastify.hasPlugin('@fastify/cookie')) {
    fastify.register(fastifyCookie);
  }

  fastify.decorateRequest('unchainedContext');
  fastify.addHook('onRequest', createMiddlewareHook(config));

  fastify.route({
    url: GRAPHQL_API_PATH,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await graphqlHandler.handleNodeRequestAndResponse(req, reply, { req, reply });
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.status(response.status);
      reply.send(response.body);
      return reply;
    },
  });

  fastify.route({ url: ERC_METADATA_API_PATH, method: ['GET'], handler: ercMetadataHandler });
  fastify.route({ url: MCP_API_PATH, method: ['GET', 'POST', 'DELETE'], handler: mcpHandler });

  fastify.register((s, opts, registered) => {
    s.register(fastifyMultipart, { throwFileSizeLimit: true, limits: { fileSize: 1024 * 1024 * 35 } });
    s.route({
      url: TEMP_UPLOAD_API_PATH,
      method: ['POST'],
      bodyLimit: 1024 * 1024 * 35,
      handler: tempUploadHandler,
    });
    registered();
  });

  fastify.register((s, opts, registered) => {
    s.removeAllContentTypeParsers();
    s.addContentTypeParser('*', (req, payload, done) => done(null));
    s.route({
      url: BULK_IMPORT_API_PATH,
      method: ['POST'],
      bodyLimit: 1024 * 1024 * 1024 * 5,
      handler: bulkImportHandler,
    });
    registered();
  });

  if (chat) connectChat(fastify, chat);
  if (initPluginMiddlewares) initPluginMiddlewares(fastify, { unchainedAPI });
  if (adminUI) {
    fastify.register(adminUIRouter, {
      enabled: true,
      prefix: typeof adminUI === 'object' ? adminUI.prefix : '/',
    });
  }
};

const fallbackLandingPageHandler = (request: FastifyRequest, reply: any) => {
  if (request.raw.method === 'GET') {
    try {
      const staticURL = import.meta.resolve('@unchainedshop/api/index.html');
      return reply.type('text/html').send(readFileSync(new URL(staticURL).pathname));
    } catch {
      const fallbackPath = new URL('../../index.html', import.meta.url).pathname;
      return reply.type('text/html').send(readFileSync(fallbackPath));
    }
  }
  return reply.status(404).send();
};

const resolveAdminUIPath = () => {
  try {
    const staticURL = import.meta.resolve('@unchainedshop/admin-ui');
    return new URL(staticURL).pathname.split('/').slice(0, -1).join('/');
  } catch {
    return null;
  }
};

export const adminUIRouter: FastifyPluginAsync<AdminUIRouterOptions> = async (fastify, opts) => {
  try {
    let fastifyStatic;
    try {
      fastifyStatic = (await import('@fastify/static')).default;
    } catch {
      fastify.log.warn("@fastify/static not installed, can't serve admin-ui");
    }

    if (fastifyStatic) {
      const adminUIPath = resolveAdminUIPath();
      if (adminUIPath) {
        await fastify.register(fastifyStatic, { root: adminUIPath, prefix: opts.prefix || '/' });
        return;
      }
    }
    await fastify.get(opts.prefix || '/', fallbackLandingPageHandler);
  } catch (e) {
    fastify.log.error(e);
    if (process.env.NODE_ENV !== 'production') {
      fastify.get('/', async (request, reply) => reply.redirect('http://localhost:3000'));
    }
  }
};

// @deprecated use adminUIRouter instead
export const fastifyRouter = adminUIRouter;
export { connectChat };
