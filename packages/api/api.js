import { ApolloServer, ApolloError } from 'apollo-server-express';
import { WebApp } from 'meteor/webapp';
import { buildLocaleContext } from 'meteor/unchained:core';
import { log } from 'meteor/unchained:core-logger';
import { AccountsServer } from '@accounts/server';
import { AccountsPassword } from '@accounts/password';
import MongoDBInterface from '@accounts/mongo';
import { MongoInternals } from 'meteor/mongo';
import { AccountsModule } from '@accounts/graphql-api';
import { DatabaseManager } from '@accounts/database-manager';
import { randomBytes } from 'crypto';

import getUserContext from './user-context';
import typeDefs from './schema';
import resolvers from './resolvers';
import { configureRoles } from './roles';

export { accountsContext } from '@accounts/graphql-api';

export callMethod from './callMethod';
export hashPassword from './hashPassword';
export getConnection from './getConnection';
export getCart from './getCart';
export * as roles from './roles';
export * as acl from './acl';
export * as errors from './errors';

const { APOLLO_ENGINE_KEY } = process.env;

global._UnchainedAPIVersion = '0.52.0'; // eslint-disable-line

const METEOR_ID_LENGTH = 17;
const idProvider = () =>
  randomBytes(30)
    .toString('base64')
    .replace(/[\W_]+/g, '')
    .substr(0, METEOR_ID_LENGTH);

const dateProvider = (date) => date || new Date();

const mongoStorage = new MongoDBInterface(
  MongoInternals.defaultRemoteCollectionDriver().mongo.db,
  {
    convertUserIdToMongoObjectId: false,
    convertSessionIdToMongoObjectId: false,
    idProvider,
    dateProvider,
  },
);

const dbManager = new DatabaseManager({
  sessionStorage: mongoStorage,
  userStorage: mongoStorage,
});

const options = {
  tokenSecret: 'insecure',
  tokenConfigs: {
    refreshToken: {
      expiresIn: '90d',
    },
  },
  // siteUrl: 'http://localhost:4010',
};

export const accountsPassword = new AccountsPassword();

export const accountsServer = new AccountsServer(
  { db: dbManager, ...options },
  {
    password: accountsPassword,
  },
);

AccountsModule.forRoot({ accountsServer });

const logGraphQLServerError = (error) => {
  try {
    const {
      message,
      extensions: {
        exception: { stacktrace, ...parameters },
        ...extensions
      },
      ...rest
    } = error;
    log(`${message} ${extensions && extensions.code}`, {
      level: 'error',
      ...extensions,
      ...rest,
    });
    console.error(stacktrace, parameters); // eslint-disable-line
  } catch (e) { } // eslint-disable-line
};

const defaultContext = (req) => {
  const remoteAddress =
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  return { remoteAddress };
};

const startUnchainedServer = (options) => {
  const {
    corsOrigins = null, // no cookie handling
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    context = defaultContext,
    rolesOptions,
    engine = {},
    ...apolloServerOptions
  } = options || {};

  configureRoles(rolesOptions);

  const server = new ApolloServer({
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    context: async ({ req }) => {
      const userContext = await getUserContext(req);
      return {
        ...userContext,
        ...buildLocaleContext(req),
        ...context(req),
      };
    },
    formatError: (error) => {
      logGraphQLServerError(error);
      const {
        message,
        extensions: { exception, code, ...extensions }, // removes exception
      } = error;
      return new ApolloError(message, code, {
        code,
        ...extensions,
      });
    },
    engine: APOLLO_ENGINE_KEY
      ? {
          apiKey: APOLLO_ENGINE_KEY,
          privateVariables: [
            'email',
            'plainPassword',
            'oldPlainPassword',
            'newPlainPassword',
          ],
          ...engine,
        }
      : undefined,
    ...apolloServerOptions,
  });

  const originFn =
    corsOrigins && Array.isArray(corsOrigins)
      ? (origin, callback) => {
          if (corsOrigins.length === 0 || !origin) {
            callback(null, true);
            return;
          }
          if (corsOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : corsOrigins;

  server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql',
    cors: !originFn
      ? undefined
      : {
          origin: originFn,
          credentials: true,
        },
    bodyParserConfig: {
      limit: '5mb',
    },
  });

  WebApp.connectHandlers.use('/graphql', (req, res) => {
    if (req.method === 'GET') {
      res.end();
    }
  });

  return {
    apolloGraphQLServer: server,
  };
};

export default startUnchainedServer;
