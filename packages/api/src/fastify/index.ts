import { getCurrentContextResolver, type LoginFn, type LogoutFn } from '../context.ts';
import MongoStore from '../mongo-store.ts';
import type { YogaServerInstance } from 'graphql-yoga';
import type { mongodb } from '@unchainedshop/mongodb';
import type { UnchainedCore } from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';
import { API_EVENTS } from '../events.ts';
import type { User } from '@unchainedshop/core-users';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import type { FastifyBaseLogger, FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createLogger } from '@unchainedshop/logger';
import mcpHandler from './mcpHandler.ts';
import { connectChat } from './chatHandler.ts';
import type { ChatConfiguration } from '../chat/utils.ts';
import { mountPluginRoutes } from './mountPluginRoutes.ts';
import { readFileSync } from 'node:fs';
export interface AdminUIRouterOptions {
  prefix: string;
  enabled?: boolean;
}

const resolveUserRemoteAddress = (req: FastifyRequest) => {
  const remoteAddress =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress;

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const {
  MCP_API_PATH = '/mcp',
  GRAPHQL_API_PATH = '/graphql',
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE = 'none',
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

const middlewareHook = async function middlewareHook(req: any, reply: any) {
  const setHeader = (key, value) => reply.header(key, value);
  const getHeader = (key) => req.headers[key];
  const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

  const context = getCurrentContextResolver();

  const login: LoginFn = async function (user: User, options = {}) {
    const { impersonator } = options;

    req.session.userId = user._id;
    req.session.impersonatorId = impersonator?._id;

    const tokenObject = {
      _id: req.session.sessionId,
      userId: user._id,

      tokenExpires: new Date((req as any).session.cookie._expires),
    };
    await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, tokenObject);

    (user as any)._inLoginMethodResponse = true;
    return { user, ...tokenObject };
  };

  const logout: LogoutFn = async function logout() {
    const tokenObject = {
      _id: (req as any).session.sessionId,
      userId: req.session?.userId,
    };
    req.session.userId = null;
    req.session.impersonatorId = null;
    await emit(API_EVENTS.API_LOGOUT, tokenObject);
    return true;
  };

  const [, accessToken] = req.headers.authorization?.split(' ') || [];

  (req as any).unchainedContext = await context(
    {
      setHeader,
      getHeader,
      remoteAddress,
      remotePort,
      login,
      logout,
      accessToken,
      userId: req.session.userId,
      impersonatorId: req.session.impersonatorId,
    },
    req,
    reply,
  );
};

export const unchainedLogger = (prefix: string): FastifyBaseLogger => {
  const logger = createLogger(prefix);
  function Logger(...args) {
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

export const connect = async (
  fastify: FastifyInstance,
  {
    graphqlHandler,
    db,
    unchainedAPI,
  }: {
    graphqlHandler: YogaServerInstance<any, any>;
    db: mongodb.Db;
    unchainedAPI: UnchainedCore;
  },
  {
    allowRemoteToLocalhostSecureCookies = false,
    adminUI = false,
    chat,
  }: {
    allowRemoteToLocalhostSecureCookies?: boolean;
    adminUI?: boolean | Omit<AdminUIRouterOptions, 'enabled'>;
    chat?: ChatConfiguration;
  } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    // Workaround: Allow to use sandbox with localhost
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

  const cookieName = UNCHAINED_COOKIE_NAME;
  const domain = UNCHAINED_COOKIE_DOMAIN;
  const path = UNCHAINED_COOKIE_PATH;
  const secure = UNCHAINED_COOKIE_INSECURE ? false : true;
  const sameSite = ({
    none: 'none',
    lax: 'lax',
    strict: 'strict',
    '1': true,
    '0': false,
  }[UNCHAINED_COOKIE_SAMESITE?.trim()?.toLowerCase()] || false) as boolean | 'none' | 'lax' | 'strict';

  if (!fastify.hasPlugin('@fastify/cookie')) {
    fastify.register(fastifyCookie);
  }
  fastify.register(fastifySession as any, {
    secret: process.env.UNCHAINED_TOKEN_SECRET,
    cookieName,
    store: MongoStore.create({
      client: (db as any).client,
      dbName: db.databaseName,
      collectionName: 'sessions',
    }),
    cookie: {
      domain,
      httpOnly: true,
      path,
      secure,
      sameSite,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });

  fastify.decorateRequest('unchainedContext');
  fastify.addHook('onRequest', middlewareHook);

  fastify.route({
    url: GRAPHQL_API_PATH,
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      // Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
      const response = await graphqlHandler.handleNodeRequestAndResponse(req, reply, {
        req,
        reply,
      });
      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });
      reply.status(response.status);
      reply.send(response.body);
      return reply;
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

  // Mount plugin routes automatically
  mountPluginRoutes(fastify, unchainedAPI);

  if (adminUI) {
    fastify.register(adminUIRouter, {
      enabled: true,
      prefix: typeof adminUI === 'object' ? adminUI.prefix : '/',
    });
  }
};

const fallbackLandingPageHandler = (request, reply) => {
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
