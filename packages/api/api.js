import { ApolloServer, ApolloError } from 'apollo-server-express';
import { WebApp } from 'meteor/webapp';
import { buildLocaleContext } from 'meteor/unchained:core';
import { log } from 'meteor/unchained:core-logger';
import getUserContext from './user-context';
import typeDefs from './schema';
import resolvers from './resolvers';
import { configureRoles } from './roles';

export callMethod from './callMethod';
export hashPassword from './hashPassword';
export getConnection from './getConnection';
export getCart from './getCart';
export * as roles from './roles';
export * as acl from './acl';
export * as errors from './errors';

const { APOLLO_ENGINE_KEY } = process.env;

global._UnchainedAPIVersion = '0.51.0'; // eslint-disable-line

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
  } catch (e) {} // eslint-disable-line
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
