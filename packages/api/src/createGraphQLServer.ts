import { createLogger } from '@unchainedshop/logger';
import { createYoga, createSchema, YogaServerOptions, YogaSchemaDefinition } from 'graphql-yoga';

const logger = createLogger('unchained:api');

export interface UnchainedSchemaExtension {
  typeDefs: string[];
  resolvers: Record<string, any>[];
  schema?: YogaSchemaDefinition<any, any>;
}

export type GraphQLServerOptions = YogaServerOptions<any, any> & UnchainedSchemaExtension;

export default async (options: GraphQLServerOptions) => {
  const schema =
    'schema' in options
      ? options.schema
      : createSchema({
          typeDefs: options.typeDefs,
          resolvers: options.resolvers,
        });

  const server = createYoga({
    schema,
    logging: logger,
    context: async (ctx: any) => {
      return (ctx.req as any)?.unchainedContext;
    },
    ...options,
  });

  return server;
};
