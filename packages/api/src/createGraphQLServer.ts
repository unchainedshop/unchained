import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { GraphQLError } from 'graphql';
import { graphqlUploadExpress } from 'graphql-upload';
import { log, LogLevel } from '@unchainedshop/logger';
import cors from 'cors';
import bodyParser from 'body-parser';
import typeDefs from './schema';
import resolvers from './resolvers';
import { getCurrentContextResolver } from './context';

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
      level: LogLevel.Error,
      ...extensions,
      ...rest,
    });
    console.error(stacktrace, parameters); // eslint-disable-line
  } catch (e) {} // eslint-disable-line
};

export default async (expressApp, options) => {
  const {
    corsOrigins = null, // no cookie handling
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    engine = {},
    ...apolloServerOptions
  } = options || {};

  const context = getCurrentContextResolver();

  const server = new ApolloServer({
    // csrfPrevention: true,
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    formatError: (error) => {
      logGraphQLServerError(error);
      const {
        message,
        path,
        extensions: { exception, code, ...extensions }, // eslint-disable-line
      } = error;
      const apolloError = new GraphQLError(message, {
        extensions: {
          code,
          ...extensions,
        },
      });
      // eslint-disable-next-line
      // @ts-ignore
      apolloError.path = path;
      return apolloError;
    },
    apollo: APOLLO_ENGINE_KEY
      ? {
          key: APOLLO_ENGINE_KEY,
          privateVariables: ['email', 'plainPassword', 'oldPlainPassword', 'newPlainPassword'],
          ...engine,
        }
      : undefined,
    ...apolloServerOptions,
  });

  await server.start();

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

  expressApp.use(
    '/graphql',
    cors(
      !originFn
        ? undefined
        : {
            origin: originFn,
            credentials: true,
          },
    ),
    bodyParser.json(),
    graphqlUploadExpress(),
    expressMiddleware(server, {
      context,
    }),
  );

  // expressApp.use(handleUploads({ maxFileSize: 10000000, maxFiles: 10 }));
  // expressApp.use(middleware);

  return server;
};
