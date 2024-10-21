import { getCurrentContextResolver } from '../context.js';
// import createBulkImportMiddleware from './createBulkImportMiddleware.js';
// import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import MongoStore from 'connect-mongo';
import { YogaServerInstance } from 'graphql-yoga';
import { mongodb } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';
import { API_EVENTS } from '../events.js';
import { User } from '@unchainedshop/core-users';
import { IncomingMessage } from 'http';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';

const resolveUserRemoteAddress = (req: IncomingMessage) => {
  const remoteAddress =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress;

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const {
  GRAPHQL_API_PATH = '/graphql',
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  NODE_ENV,
} = process.env;

const middlewareHook = async function middlewareHook(req: any, reply: any) {
  const setHeader = (key, value) => reply.header(key, value);
  const getHeader = (key) => req.headers[key];
  const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

  const context = getCurrentContextResolver();

  async function login(user: User) {
    req.session.user = user;
    req.session.userId = user._id;
    const tokenObject = {
      _id: req.session.sessionId,
      /* eslint-disable-next-line */
      tokenExpires: new Date((req as any).session?.cookie._expires),
    };
    await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, { userId: user._id, ...tokenObject });
    /* eslint-disable-next-line */
    (user as any)._inLoginMethodResponse = true;
    return { user, ...tokenObject };
  }

  async function logout() {
    /* eslint-disable-line */
    if (!req.session?.userId) return false;
    const tokenObject = {
      _id: (req as any).session.sessionId,
      userId: req.session?.userId,
    };
    req.session.user = null;
    req.session.userId = null;
    await emit(API_EVENTS.API_LOGOUT, tokenObject);
    return true;
  }

  (req as any).unchainedContext = await context({
    setHeader,
    getHeader,
    remoteAddress,
    remotePort,
    login,
    logout,
    user: req.session.user,
    userId: req.session.userId,
  });
};

export const connect = (
  fastify: any,
  {
    graphqlHandler,
    db,
  }: { graphqlHandler: YogaServerInstance<any, any>; db: mongodb.Db; unchainedAPI: UnchainedCore },
) => {
  fastify.register(fastifyCookie);
  fastify.register(fastifySession, {
    secret: process.env.UNCHAINED_TOKEN_SECRET,
    cookieName: UNCHAINED_COOKIE_NAME,
    store: MongoStore.create({
      client: (db as any).client,
      dbName: db.databaseName,
      collectionName: 'sessions',
    }),
    cookie: {
      domain: UNCHAINED_COOKIE_DOMAIN,
      httpOnly: Boolean(NODE_ENV === 'production'),
      path: UNCHAINED_COOKIE_PATH,
      secure: NODE_ENV === 'production',
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

  //   expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  //   expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
};
