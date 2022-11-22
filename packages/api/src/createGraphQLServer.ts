import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { log, LogLevel } from '@unchainedshop/logger';
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
      level: LogLevel.Error,
      ...extensions,
      ...rest,
    });
    console.error(stacktrace, parameters); // eslint-disable-line
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

  return server;
};
