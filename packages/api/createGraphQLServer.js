import { ApolloServer, ApolloError } from 'apollo-server-express';
import { WebApp } from 'meteor/webapp';
import { log } from 'meteor/unchained:core-logger';

import typeDefs from './schema';
import resolvers from './resolvers';

const { APOLLO_ENGINE_KEY } = process.env;

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

export default (options) => {
  const {
    corsOrigins = null, // no cookie handling
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    contextResolver,
    context,
    engine = {},
    ...apolloServerOptions
  } = options || {};

  const server = new ApolloServer({
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    context: context
      ? ({ req, res }) => {
          return context({ req, res, unchainedContextFn: contextResolver });
        }
      : contextResolver,
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

  return server;
};
