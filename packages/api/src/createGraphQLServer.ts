import { ApolloServer } from '@apollo/server';
import { log, LogLevel } from '@unchainedshop/logger';
import { GraphQLFormattedError } from 'graphql';
import typeDefs from './schema';
import resolvers from './resolvers';

const { APOLLO_ENGINE_KEY } = process.env;

const logGraphQLServerError = (error: GraphQLFormattedError) => {
  try {
    const {
      message,
      extensions: { stacktrace, ...parameters },
      ...rest
    } = error;
    log(`${message} ${parameters && parameters.code}`, {
      level: LogLevel.Error,
      ...parameters,
      ...rest,
    });
    if (stacktrace) {
      const nativeError = new Error(message);
      nativeError.stack = (stacktrace as string[]).join('\n');
      nativeError.name = parameters.code as string;
      log(nativeError, { level: LogLevel.Debug });
    }
  } catch (e) {} // eslint-disable-line
};

export default async (options) => {
  const {
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    engine = {},
    ...apolloServerOptions
  } = options || {};

  const server = new ApolloServer({
    typeDefs: [...typeDefs, ...additionalTypeDefs],
    resolvers: [resolvers, ...additionalResolvers],
    formatError: (error) => {
      logGraphQLServerError(error);
      return error;
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

  return server;
};
