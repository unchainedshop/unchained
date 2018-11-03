import { ApolloServer } from 'apollo-server-express';
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
export * as roles from './roles';
export * as resolvers from './resolvers';

const {
  APOLLO_ENGINE_KEY,
} = process.env;

const defaultContext = (req) => {
  const remoteAddress = req.headers['x-real-ip']
    || req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress;
  return { remoteAddress };
};

const startUnchainedServer = (options = {}) => {
  const {
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    context = defaultContext,
    rolesOptions,
  } = options || {};

  configureRoles(rolesOptions);

  const server = new ApolloServer({
    typeDefs: [
      ...typeDefs,
      ...additionalTypeDefs,
    ],
    resolvers: [
      resolvers,
      ...additionalResolvers,
    ],
    context: async ({ req }) => {
      const userContext = await getUserContext(req);
      return {
        ...userContext,
        ...buildLocaleContext(req),
        ...context(req),
      };
    },
    formatError: (error) => {
      const { message, ...rest } = error;
      log(message, { level: 'error', ...rest });
      return error;
    },
    tracing: true,
    cacheControl: true,
    engine: APOLLO_ENGINE_KEY ? {
      apiKey: APOLLO_ENGINE_KEY,
      logging: {
        level: 'WARN', // ApolloEngine Proxy logging level. DEBUG, INFO, WARN or ERROR
      },
    } : null,
  });

  server.applyMiddleware({
    app: WebApp.connectHandlers,
    path: '/graphql',
  });

  WebApp.connectHandlers.use('/graphql', (req, res) => {
    if (req.method === 'GET') {
      res.end();
    }
  });
};

export default startUnchainedServer;
