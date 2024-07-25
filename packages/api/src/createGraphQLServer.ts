import { createLogger } from '@unchainedshop/logger';
import { buildDefaultTypeDefs } from './schema/index.js';
import resolvers from './resolvers/index.js';
import { actions } from './roles/index.js';
import { createYoga, createSchema } from 'graphql-yoga';

const logger = createLogger('unchained:api');

export default async (options) => {
  const {
    typeDefs: additionalTypeDefs = [],
    resolvers: additionalResolvers = [],
    events = [],
    workTypes = [],
    schema: customSchema,
    ...graphQLServerOptions
  } = options || {};

  const schema =
    customSchema ||
    createSchema({
      typeDefs: [
        ...buildDefaultTypeDefs({
          actions: Object.keys(actions),
          events,
          workTypes,
        }),
        ...additionalTypeDefs,
      ],
      resolvers: [resolvers, ...additionalResolvers],
    });

  const server = createYoga({
    schema,
    logging: logger,
    context: async (ctx: any) => {
      return (ctx.req as any)?.unchainedContext;
    },
    ...graphQLServerOptions,
  });

  return server;
};
