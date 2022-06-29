import { ApolloServer, ApolloError } from 'apollo-server-express';
import { processRequest } from 'graphql-upload';
import { log, LogLevel } from '@unchainedshop/logger';
import typeDefs from './schema';
import resolvers from './resolvers';
import { getCurrentContextResolver } from './context';

const { APOLLO_ENGINE_KEY } = process.env;

// Stub
const WebApp = { connectHandlers: { use: () => {} } };

const handleUploads = (options) => async (req, res, next) => {
  const contentType = req.headers['content-type'];
  const isUpload = contentType && contentType.startsWith('multipart/form-data');
  if (isUpload) {
    req.body = await processRequest(req, res, options);
  }
  next();
};

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
      level: LogLevel.Error,
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
    engine = {},
    ...apolloServerOptions
  } = options || {};

  const context = getCurrentContextResolver();
  const server = new ApolloServer({
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    context,
    uploads: false,
    formatError: (error) => {
      logGraphQLServerError(error);
      const {
        message,
        path,
        extensions: { exception, code, ...extensions }, // eslint-disable-line
      } = error;
      const apolloError = new ApolloError(message, code as string, {
        code,
        ...extensions,
      });
      apolloError.path = path;
      return apolloError;
    },
    engine: APOLLO_ENGINE_KEY
      ? {
          apiKey: APOLLO_ENGINE_KEY,
          privateVariables: ['email', 'plainPassword', 'oldPlainPassword', 'newPlainPassword'],
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

  const middleware = server.getMiddleware({
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

  WebApp.connectHandlers.use(handleUploads({ maxFileSize: 10000000, maxFiles: 10 }));
  WebApp.connectHandlers.use(middleware);
  return server;
};
