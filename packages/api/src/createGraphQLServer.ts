import { createLogger } from '@unchainedshop/logger';
import {
  createYoga,
  createSchema,
  type YogaServerOptions,
  type YogaSchemaDefinition,
} from 'graphql-yoga';
import { useEngine } from '@envelop/core';
import { parse, validate, specifiedRules, execute, subscribe } from 'graphql';

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
    // graphql-js reference engine instead of @graphql-tools/executor: the ported
    // executor drops schema argument defaults for unprovided variables on graphql 17.
    plugins: [
      useEngine({ parse, validate, specifiedRules, execute, subscribe }),
      ...(options.plugins ?? []),
    ],
  });

  return server;
};
