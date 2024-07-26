import type e from 'express';
import { getCurrentContextResolver } from '../context.js';
import createBulkImportMiddleware from './createBulkImportMiddleware.js';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { YogaServer } from 'graphql-yoga';
import setupPassport from './passport/setup.js';
import { mongodb } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { emit } from '@unchainedshop/events';
import { API_EVENTS } from '../events.js';
import { User } from '@unchainedshop/types/user.js';
import { IncomingMessage } from 'http';

const resolveUserRemoteAddress = (req: IncomingMessage) => {
  const remoteAddress =
    (req.headers['x-real-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.socket?.remoteAddress;

  const remotePort = req.socket?.remotePort;

  return { remoteAddress, remotePort };
};

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  GRAPHQL_API_PATH = '/graphql',
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  NODE_ENV,
} = process.env;

const addContext = async function middlewareWithContext(
  req: e.Request & { cookies: any },
  res: e.Response,
  next: e.NextFunction,
) {
  try {
    const setHeader = (key, value) => res.setHeader(key, value);
    const getHeader = (key) => req.headers[key];
    const cookies = req.cookies;
    const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

    const context = getCurrentContextResolver();

    const login = async (user: User) => {
      await new Promise((resolve, reject) => {
        (req as any).login(user, (error, result) => {
          if (error) {
            return reject(error);
          }
          return resolve(result);
        });
      });

      const tokenObject = {
        _id: (req as any).sessionID,
        /* eslint-disable-next-line */
        tokenExpires: new Date((req as any).session?.cookie._expires),
      };

      await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, { userId: user._id, ...tokenObject });

      /* eslint-disable-next-line */
      (user as any)._inLoginMethodResponse = true;
      return { user, ...tokenObject };
    };

    const logout = async (sessionId?: string) => { /* eslint-disable-line */
      // TODO: this should only logout an explicitly provided session if sessionID
      // has been provided
      // express-session destroy
      const { user } = req as any;
      if (!user) return false;

      const tokenObject = {
        _id: sessionId || (req as any).sessionID,
        userId: user._id,
      };

      await new Promise((resolve, reject) => {
        (req as any).logout((error, result) => {
          if (error) {
            return reject(error);
          }
          return resolve(result);
        });
      });

      await emit(API_EVENTS.API_LOGOUT, tokenObject);
      return true;
    };

    (req as any).unchainedContext = await context({
      setHeader,
      getHeader,
      cookies,
      remoteAddress,
      remotePort,
      login,
      logout,
      user: (req as any).user,
      userId: (req as any).user?._id,
    });
    next();
  } catch (error) {
    next(error);
  }
};

export const connect = (
  expressApp: e.Express,
  {
    graphqlHandler,
    db,
    unchainedAPI,
  }: { graphqlHandler: YogaServer<any, any>; db: mongodb.Db; unchainedAPI: UnchainedCore },
) => {
  const passport = setupPassport(unchainedAPI);

  expressApp.use(cookieParser(), addContext);
  expressApp.use(passport.initialize());
  expressApp.use(
    session({
      secret: process.env.UNCHAINED_TOKEN_SECRET,
      store: MongoStore.create({
        client: (db as any).client,
        dbName: db.databaseName,
        collectionName: 'sessions',
      }),
      name: UNCHAINED_COOKIE_NAME,
      saveUninitialized: false,
      resave: false,
      cookie: {
        domain: UNCHAINED_COOKIE_DOMAIN,
        httpOnly: Boolean(NODE_ENV === 'production'),
        path: UNCHAINED_COOKIE_PATH,
        sameSite: 'lax',
        secure: NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );
  expressApp.use(passport.session());
  expressApp.use(passport.authenticate('access-token', { session: false }));
  expressApp.use(GRAPHQL_API_PATH, graphqlHandler);
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
};
