import { createLogger } from '@unchainedshop/logger';
import {
  createYoga,
  createSchema,
  type YogaServerOptions,
  type YogaSchemaDefinition,
} from 'graphql-yoga';
import { useDisableIntrospection } from '@graphql-yoga/plugin-disable-introspection';

const logger = createLogger('unchained:api');

export interface UnchainedSchemaExtension {
  typeDefs: string[];
  resolvers: Record<string, any>[];
  schema?: YogaSchemaDefinition<any, any>;
  /**
   * Enable GraphQL introspection queries.
   * By default, introspection is disabled in production (NODE_ENV=production)
   * to prevent schema enumeration attacks.
   * Set to true to explicitly enable introspection even in production.
   */
  introspection?: boolean;
}

export type GraphQLServerOptions = YogaServerOptions<any, any> & UnchainedSchemaExtension;

export default async (options: GraphQLServerOptions) => {
  const { introspection, ...restOptions } = options;

  const schema =
    'schema' in restOptions
      ? restOptions.schema
      : createSchema({
          typeDefs: restOptions.typeDefs,
          resolvers: restOptions.resolvers,
        });

  // Disable introspection in production to prevent schema enumeration attacks
  // Unless explicitly enabled via the introspection option
  const shouldDisableIntrospection = process.env.NODE_ENV === 'production' && introspection !== true;
  const productionPlugins = shouldDisableIntrospection ? [useDisableIntrospection()] : [];

  const server = createYoga({
    schema,
    logging: logger,
    context: async (ctx: any) => {
      return (ctx.req as any)?.unchainedContext;
    },
    plugins: [...productionPlugins, ...(restOptions.plugins || [])],
    ...restOptions,
  });

  return server;
};
