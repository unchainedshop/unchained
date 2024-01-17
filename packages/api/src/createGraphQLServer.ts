import { ApolloServer } from '@apollo/server';
import { log, LogLevel } from '@unchainedshop/logger';
import { GraphQLFormattedError } from 'graphql';
import { buildDefaultTypeDefs } from './schema/index.js';
import resolvers from './resolvers/index.js';
import { actions } from './roles/index.js';

const logGraphQLServerError = (error: GraphQLFormattedError) => {
  try {
    const {
      message,
      extensions: { stacktrace, ...parameters },
      ...rest
    } = error;

    const nativeError = new Error(message);
    nativeError.stack = (stacktrace as string[]).join('\n');
    nativeError.name = parameters.code as string;
    log(nativeError, {
      level: LogLevel.Error,
      ...parameters,
      ...rest,
    });
  } catch (e) {} // eslint-disable-line
};

export default async (options) => {
  const {
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    events = [],
    workTypes = [],
    ...apolloServerOptions
  } = options || {};

  const server = new ApolloServer({
    typeDefs: [
      ...buildDefaultTypeDefs({
        actions: Object.keys(actions),
        events,
        workTypes,
      }),
      ...additionalTypeDefs,
    ],
    resolvers: [resolvers, ...additionalResolvers],
    formatError: (error) => {
      logGraphQLServerError(error);
      return error;
    },
    ...apolloServerOptions,
  });

  return server;
};
