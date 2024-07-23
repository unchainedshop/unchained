import './load_env.js';
import {
  startPlatform,
  connectPlatformToExpress4,
  setAccessToken,
  withAccessToken,
} from '@unchainedshop/platform';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import { log } from '@unchainedshop/logger';
import setupTicketing, { ticketingModules } from '@unchainedshop/ticketing';
import { TicketingAPI } from '@unchainedshop/ticketing';

import serveStatic from 'serve-static';
import '@unchainedshop/plugins/pricing/discount-half-price-manual.js';
import '@unchainedshop/plugins/pricing/discount-100-off.js';

import seed from './seed.js';
import ticketingServices from '@unchainedshop/ticketing/services.js';

import { createSchema, createYoga } from 'graphql-yoga';
import { App, HttpRequest, HttpResponse } from 'uWebSockets.js';

const start = async () => {
  interface ServerContext {
    req: HttpRequest;
    res: HttpResponse;
  }

  const engine = await startPlatform({
    introspection: true,
    modules: { ...defaultModules, ...ticketingModules },
    services: { ...ticketingServices },
    context: withAccessToken(),
    plugins: [],
    options: {
      accounts: {
        password: {
          twoFactor: {
            appName: 'Example',
          },
        },
      },
      payment: {
        filterSupportedProviders: async ({ providers }) => {
          return providers.sort((left, right) => {
            if (left.adapterKey < right.adapterKey) {
              return -1;
            }
            if (left.adapterKey > right.adapterKey) {
              return 1;
            }
            return 0;
          });
        },
      },
    },
  });

  await seed(engine.unchainedAPI);
  await setAccessToken(engine.unchainedAPI, 'admin', 'secret');

  // Start the GraphQL Server
  // await engine.apolloGraphQLServer.start();

  // connectPlatformToExpress4(app, engine);
  // connectDefaultPluginsToExpress4(app, engine);

  // // Unchained Ticketing Extension
  // setupTicketing(app, engine.unchainedAPI as TicketingAPI, {
  //   renderOrderPDF: console.log,
  //   createAppleWalletPass: console.log,
  //   createGoogleWalletPass: console.log,
  // });

  const yoga = createYoga<ServerContext>({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
        type Query {
          hello: String!
        }
      `,
      resolvers: {
        Query: {
          hello: () => 'Hello world!',
        },
      },
    }),
  });

  App()
    .any('/*', yoga)
    .listen('localhost', process.env.PORT ? parseInt(process.env.PORT, 10) : 3000, () => {
      log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
    });
};

start();
