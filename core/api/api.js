import { WebApp } from 'meteor/webapp';
import { buildLocaleContext } from 'meteor/unchained:core';
import { log } from 'meteor/unchained:core-logger';
import { ApolloEngine } from 'apollo-engine';
import { makeExecutableSchema } from 'graphql-tools';
import { formatError } from 'apollo-errors';
import cors from 'cors';
import multer from 'multer';
import { createApolloServer } from './server';
import typeDefs from './schema/schema.graphql';
import resolvers from './resolvers';
import graphqlServerExpressUpload from './uploadMiddleware';
import { configureRoles } from './roles';

export callMethod from './callMethod';
export hashPassword from './hashPassword';
export getConnection from './getConnection';
export * as roles from './roles';
export * as resolvers from './resolvers';

const {
  APOLLO_ENGINE_KEY,
} = process.env;

const engine = new ApolloEngine({
  apiKey: APOLLO_ENGINE_KEY,
  logging: {
    level: 'WARN', // ApolloEngine Proxy logging level. DEBUG, INFO, WARN or ERROR
  },
});

if (APOLLO_ENGINE_KEY) {
  engine.meteorListen(WebApp);
} else {
  log('Could not start Apollo Engine because of missing API key', { level: 'error' });
}

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

  const schema = makeExecutableSchema({
    typeDefs: [
      ...typeDefs.definitions,
      ...additionalTypeDefs,
    ],
    resolvers: [
      resolvers,
      ...additionalResolvers,
    ],
  });

  createApolloServer((req) => {
    if (req.headers.authorization) {
      const [type, token] = req.headers.authorization.split(' ');
      if (type === 'Bearer') {
        req.headers['meteor-login-token'] = token;
      }
    }

    return {
      schema,
      formatError: (...args) => {
        const { message, ...rest } = args[0];
        log(message, { level: 'error', ...rest });
        return formatError(...args);
      },
      context: {
        ...buildLocaleContext(req),
        ...context(req),
      },
      tracing: true,
      cacheControl: true,
    };
  }, {
    configServer(graphQLServer) {
      // add some more express middlewares before graphQL picks up the request
      // especially multer and graphqlServerExpressUpload allow for multipart
      // formdata along the query
      // and therefore can take arbitrary binaries (uploading files through graphql)
      graphQLServer.use(
        cors({ credentials: true }),
        multer({ inMemory: true }).any(),
        graphqlServerExpressUpload(),
      );
    },
  });
};

export default startUnchainedServer;
