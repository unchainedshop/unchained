import { createLogger } from '@unchainedshop/logger';
import {
  createYoga,
  createSchema,
  type YogaServerOptions,
  type YogaSchemaDefinition,
} from 'graphql-yoga';
import { useEngine } from '@envelop/core';
import { execute, subscribe } from 'graphql';

const logger = createLogger('unchained:api');

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
    logging: logger,
    context: async (ctx: any) => {
      return (ctx.req as any)?.unchainedContext;
    },
    // Reflecting an arbitrary origin together with Allow-Credentials would let any
    // website read the API as the logged-in user. Integrators that serve a storefront
    // from another origin can opt in by passing their own cors option.
    cors: { credentials: false },
    multipart: false,
    ...options,
    // graphql-js reference engine instead of @graphql-tools/executor: the ported
    // executor drops schema argument defaults for unprovided variables on graphql 17.
    plugins: [
      useEngine({ execute, subscribe }),
      useRejectSimpleRequestContentTypes(),
      ...(options.plugins ?? []),
    ],
  });

  return server;
};
