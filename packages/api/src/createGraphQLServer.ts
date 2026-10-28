import { createLogger } from '@unchainedshop/logger';
import {
  createYoga,
  createSchema,
  type Logger,
  type YogaServerOptions,
  type YogaSchemaDefinition,
} from 'graphql-yoga';

const logger = createLogger('unchained:api');

const forwardTo =
  (log: (message: any, ...args: any[]) => void) => (attributes?: unknown, message?: string) => {
    if (typeof attributes === 'string') return log(attributes);
    const resolvedAttributes = typeof attributes === 'function' ? attributes() : attributes;
    return message === undefined ? log(resolvedAttributes) : log(message, resolvedAttributes);
  };

// Not a @graphql-hive/logger Logger: its constructor throws on LOG_LEVEL values like "Info".
// Yoga logs every processed request at info, which stays at debug level here.
const yogaLogger = {
  trace: forwardTo(logger.trace),
  debug: forwardTo(logger.debug),
  info: forwardTo(logger.debug),
  warn: forwardTo(logger.warn),
  error: forwardTo(logger.error),
  child: () => yogaLogger,
};

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
    logging: yogaLogger as unknown as Logger,
    context: async (ctx: any) => {
      return (ctx.req as any)?.unchainedContext;
    },
    ...options,
  });

  return server;
};
