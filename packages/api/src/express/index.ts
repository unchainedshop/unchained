import e from 'express';
import { getCurrentContextResolver, LoginFn, LogoutFn } from '../context.js';
import createBulkImportMiddleware from './createBulkImportMiddleware.js';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { Passport } from 'passport';
import { YogaServerInstance } from 'graphql-yoga';
import { mongodb } from '@unchainedshop/mongodb';
import { UnchainedCore } from '@unchainedshop/core';
import { emit } from '@unchainedshop/events';
import { API_EVENTS } from '../events.js';
import { User } from '@unchainedshop/core-users';

const resolveUserRemoteAddress = (req: e.Request) => {
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
  UNCHAINED_COOKIE_SAMESITE,
  UNCHAINED_COOKIE_INSECURE,
} = process.env;

const addContext = async function middlewareWithContext(
  req: e.Request,
  res: e.Response,
  next: e.NextFunction,
) {
  try {
    const setHeader = (key, value) => res.setHeader(key, value);
    const getHeader = (key) => req.headers[key] as string;
    const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

    const context = getCurrentContextResolver();

    const login: LoginFn = async (user: User) => {
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
        userId: user._id,
        /* eslint-disable-next-line */
        tokenExpires: new Date((req as any).session?.cookie._expires),
      };

      await emit(API_EVENTS.API_LOGIN_TOKEN_CREATED, tokenObject);

      /* eslint-disable-next-line */
      (user as any)._inLoginMethodResponse = true;
      return { user, ...tokenObject };
    };

    const logout: LogoutFn = async (sessionId) => { /* eslint-disable-line */
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
        userId: (req as any).user?._id,
      },
      req,
      res,
    );
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
  }: { graphqlHandler: YogaServerInstance<any, any>; db: mongodb.Db; unchainedAPI: UnchainedCore },
  {
    allowRemoteToLocalhostSecureCookies = false,
  }: { allowRemoteToLocalhostSecureCookies?: boolean } = {},
) => {
  if (allowRemoteToLocalhostSecureCookies) {
    // Workaround: Allow to use sandbox with localhost
    expressApp.set('trust proxy', 1);
    expressApp.use((req, res, next) => {
      req.headers['x-forwarded-proto'] = 'https';
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
      next();
    });
  }
  const passport = new Passport();

  passport.serializeUser(function serialize(user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(function deserialize(_id, done) {
    done(null, { _id });
  });

  const name = UNCHAINED_COOKIE_NAME;
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

  expressApp.use(
    session({
      secret: process.env.UNCHAINED_TOKEN_SECRET,
      store: MongoStore.create({
        client: (db as any).client,
        dbName: db.databaseName,
        collectionName: 'sessions',
      }),
      name,
      saveUninitialized: false,
      resave: false,
      cookie: {
        domain,
        path,
        sameSite,
        secure,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
    passport.initialize(),
    passport.session(),
    addContext,
  );
  expressApp.use(GRAPHQL_API_PATH, graphqlHandler.handle);
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware);
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware);
};
