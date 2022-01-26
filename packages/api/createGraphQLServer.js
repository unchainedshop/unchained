import { ApolloServer, ApolloError } from 'apollo-server-express';
import { processRequest } from 'graphql-upload';
import { WebApp } from 'meteor/webapp';
import { log, LogLevel } from 'meteor/unchained:logger';
import typeDefs from './schema';
import resolvers from './resolvers';

const { APOLLO_ENGINE_KEY } = process.env;

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
    context,
    engine = {},
    ...apolloServerOptions
  } = options || {};

  const server = new ApolloServer({
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    async context({ req, res }) {
      return {
        req,
        res,
        ...req.unchainedContext,
      };
    },
    uploads: false,
    formatError: (error) => {
      logGraphQLServerError(error);
      const {
        message,
        extensions: { exception, code, ...extensions }, // eslint-disable-line
      } = error;
      return new ApolloError(message, code, {
        code,
        ...extensions,
      });
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
  WebApp.connectHandlers.use(async (req, res, ...rest) => {
    const resolvedContext = await context({ req, res });
    req.unchainedContext = resolvedContext;
    middleware(req, res, ...rest);
  });
  return server;
};
