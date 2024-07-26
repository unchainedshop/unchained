import { createLogger } from '@unchainedshop/logger';
import { createYoga, createSchema, YogaServerOptions } from 'graphql-yoga';

const logger = createLogger('unchained:api');

export type GraphQLServerOptions = YogaServerOptions<any, any> & {
  typeDefs?: Array<string>;
  resolvers?: Array<Record<string, any>>;
};

export default async (options: GraphQLServerOptions) => {
  const { typeDefs, resolvers, schema: customSchema, ...graphQLServerOptions } = options || {};

  const schema =
    customSchema ||
    createSchema({
      typeDefs,
      resolvers,
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
