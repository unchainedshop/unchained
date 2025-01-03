import { getCurrentContextResolver } from '../context.js';
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
import { FastifyInstance, FastifyRequest } from 'fastify';

const resolveUserRemoteAddress = (req: FastifyRequest) => {
  const remoteAddress =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress;

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const {
  GRAPHQL_API_PATH = '/graphql',
  BULK_IMPORT_API_PATH = '/bulk-import',
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

  async function login(user: User) {
    req.session.user = user;
    const tokenObject = {
      _id: req.session.sessionId,
      userId: user._id,
      /* eslint-disable-next-line */
      tokenExpires: new Date((req as any).session?.cookie._expires),
    };
    await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, tokenObject);
    /* eslint-disable-next-line */
    (user as any)._inLoginMethodResponse = true;
    return { user, ...tokenObject };
  }

  async function logout() {
    /* eslint-disable-line */
    if (!req.session?.user?._id) return false;
    const tokenObject = {
      _id: (req as any).session.sessionId,
      userId: req.session?.user?._id,
    };
    req.session.user = null;
    await emit(API_EVENTS.API_LOGOUT, tokenObject);
    return true;
  }

  const [, accessToken] = req.headers.authorization?.split(' ') || [];

  (req as any).unchainedContext = await context({
    setHeader,
    getHeader,
    remoteAddress,
    remotePort,
    login,
    logout,
    accessToken,
    userId: req.session.user?._id,
  });
};

export const connect = (
  fastify: FastifyInstance,
  {
    graphqlHandler,
    db,
  }: { graphqlHandler: YogaServerInstance<any, any>; db: mongodb.Db; unchainedAPI: UnchainedCore },
) => {
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

  fastify.register(fastifyCookie); // TODO: Do not register when using oAuth!
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
    url: BULK_IMPORT_API_PATH,
    method: ['POST'],
    handler: bulkImportHandler,
  });
};
