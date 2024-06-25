import cors from 'cors';
import { expressMiddleware } from '@apollo/server/express4';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import e from 'express';
import { getCurrentContextResolver } from '../context.js';

export default function createApolloMiddleware(apolloGraphQLServer, { corsOrigins = undefined } = {}) {
  const contextResolver = getCurrentContextResolver();

  const originFn =
    corsOrigins && Array.isArray(corsOrigins)
      ? (origin, callback) => {
          if (corsOrigins.length === 0 || !origin) {
            callback(null, true);
            return;
          }
          if (corsOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : corsOrigins;

  return [
    cors(
      !originFn
        ? undefined
        : {
            origin: originFn,
            credentials: true,
          },
    ),
    e.json(),
    graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
    expressMiddleware(apolloGraphQLServer, {
      context: contextResolver,
    }),
  ];
}
