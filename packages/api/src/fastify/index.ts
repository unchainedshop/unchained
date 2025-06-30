import { getCurrentContextResolver, LoginFn, LogoutFn } from '../context.js';
import bulkImportHandler from './bulkImportHandler.js';
import ercMetadataHandler from './ercMetadataHandler.js';
import MongoStore from 'connect-mongo';
import { YogaServerInstance } from 'graphql-yoga';
import { mongodb } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';
import { API_EVENTS } from '../events.js';
import { User } from '@unchainedshop/core-users';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { FastifyBaseLogger, FastifyInstance, FastifyRequest } from 'fastify';
import { createLogger } from '@unchainedshop/logger';
import mcpHandler from './mcpHandler.js';
import tempUploadHandler from './tempUploadHandler.js';

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
  BULK_IMPORT_API_PATH = '/bulk-import',
  TEMP_UPLOAD_API_PATH = '/temp-upload',
  ERC_METADATA_API_PATH = '/erc-metadata/:productId/:localeOrTokenFilename/:tokenFileName?',
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  UNCHAINED_COOKIE_SAMESITE,
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

export const connect = (
  fastify: FastifyInstance,
  {
    graphqlHandler,
    db,
  }: {
    graphqlHandler: YogaServerInstance<any, any>;
    db: mongodb.Db;
    unchainedAPI: UnchainedCore;
  },
  {
    allowRemoteToLocalhostSecureCookies = false,
  }: { allowRemoteToLocalhostSecureCookies?: boolean } = {},
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
  fastify.register(fastifySession, {
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

  fastify.route({
    url: ERC_METADATA_API_PATH,
    method: ['GET'],
    handler: ercMetadataHandler,
  });

  fastify.route({
    url: MCP_API_PATH,
    method: ['GET', 'POST', 'DELETE'],
    handler: mcpHandler,
  });

  fastify.register((s, opts, registered) => {
    s.register(fastifyMultipart);
    s.route({
      url: TEMP_UPLOAD_API_PATH,
      method: ['POST'],
      bodyLimit: 1024 * 1024 * 35, // 35MB
      handler: tempUploadHandler,
    });
    registered();
  });

  fastify.register((s, opts, registered) => {
    s.removeAllContentTypeParsers();
    s.addContentTypeParser('*', function (req, payload, done) {
      done(null);
    });
    s.route({
      url: BULK_IMPORT_API_PATH,
      method: ['POST'],
      bodyLimit: 1024 * 1024 * 1024 * 5, // 5GB
      handler: bulkImportHandler,
    });
    registered();
  });
};
