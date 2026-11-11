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

// Content types a browser can send cross-site without a preflight. Accepting them on
// the GraphQL endpoint would make every cookie-authenticated mutation CSRF-able.
const SIMPLE_REQUEST_CONTENT_TYPES = [
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
];

const useRejectSimpleRequestContentTypes = () => ({
  onRequest({ request, endResponse, fetchAPI }) {
    if (request.method !== 'POST') return;
    const mediaType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (!mediaType || !SIMPLE_REQUEST_CONTENT_TYPES.includes(mediaType)) return;
    endResponse(
      new fetchAPI.Response(null, {
        status: 415,
        headers: { 'content-type': 'application/json' },
      }),
    );
  },
});

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
    context: async (ctx: any) => ctx.unchainedContext ?? ctx.req?.unchainedContext,
    // Reflecting an arbitrary origin together with Allow-Credentials would let any
    // website read the API as the logged-in user. Integrators that serve a storefront
    // from another origin can opt in by passing their own cors option.
    cors: { credentials: false },
    multipart: false,
    ...options,
    plugins: [useRejectSimpleRequestContentTypes(), ...(options.plugins ?? [])],
  });

  return server;
};
