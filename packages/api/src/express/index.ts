import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ApolloServer } from '@apollo/server';
import type e from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { Db } from 'mongodb';
import passport from 'passport';
import { getCurrentContextResolver } from '../context.js';
import createBulkImportMiddleware from './createBulkImportMiddleware.js';
import createERCMetadataMiddleware from './createERCMetadataMiddleware.js';
import createApolloMiddleware from './createApolloMiddleware.js';

const {
  UNCHAINED_COOKIE_NAME = 'unchained_token',
  UNCHAINED_COOKIE_PATH = '/',
  UNCHAINED_COOKIE_DOMAIN,
  NODE_ENV,
} = process.env;

const {
  BULK_IMPORT_API_PATH = '/bulk-import',
  ERC_METADATA_API_PATH = '/erc-metadata',
  GRAPHQL_API_PATH = '/graphql',
} = process.env;

export const useMiddlewareWithCurrentContext = (expressApp, path, ...middleware) => {
  const context = getCurrentContextResolver();
  const addContext = async function middlewareWithContext(
    req: IncomingMessage & { unchainedContext: UnchainedCore },
    res: OutgoingMessage,
    next,
  ) {
    try {
      req.unchainedContext = await context({ req, res });
      next();
    } catch (error) {
      next(error);
    }
  };

  expressApp.use(path, addContext, ...middleware);
};

export const connect = (
  expressApp: e.Express,
  {
    apolloGraphQLServer,
    db,
    unchainedAPI,
  }: { apolloGraphQLServer: ApolloServer; db: Db; unchainedAPI: UnchainedCore },
  options?: { corsOrigins?: any },
) => {
  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function (_id, done) {
    unchainedAPI.modules.users.findUserById(_id).then(
      (user) => {
        done(null, user);
      },
      (error) => {
        done(error, null);
      },
    );
  });

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
        httpOnly: true,
        path: UNCHAINED_COOKIE_PATH,
        sameSite: 'lax',
        secure: NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );
  expressApp.use(passport.session());

  const contextResolver = getCurrentContextResolver();

  expressApp.use(
    GRAPHQL_API_PATH,
    createApolloMiddleware(contextResolver, apolloGraphQLServer, options),
  );
  expressApp.use(ERC_METADATA_API_PATH, createERCMetadataMiddleware(contextResolver));
  expressApp.use(BULK_IMPORT_API_PATH, createBulkImportMiddleware(contextResolver));
  // expressApp.use(
  //   ['/', '/.well-known/unchained/cloud-sso'],
  //   createSingleSignOnMiddleware(contextResolver),
  // );
};
