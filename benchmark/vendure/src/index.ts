import { bootstrap } from '@vendure/core';
import { JobQueueService } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { EmailPlugin } from '@vendure/email-plugin';
import { DefaultSearchPlugin } from '@vendure/search-plugin';
import { DefaultJobQueuePlugin } from '@vendure/job-queue-plugin';
import { join } from 'path';
import { ConnectionOptions } from 'typeorm';
import { VendureConfig } from '@vendure/core';
import { seedVendure } from './seed';

const PORT = process.env.PORT || 3001;

/**
 * Configuration for Vendure server
 */
const config: VendureConfig = {
  apiOptions: {
    port: PORT,
    adminApiPath: 'admin-api',
    shopApiPath: 'shop-api',
    adminApiPlayground: true,
    shopApiPlayground: true,
  },
  authOptions: {
    tokenMethod: 'bearer',
    superadminCredentials: {
      identifier: 'superadmin',
      password: 'superadmin123',
    },
  },
  dbConnectionOptions: {
    type: 'postgres',
    synchronize: true,
    logging: false,
    database: process.env.POSTGRES_DB || 'vendure',
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
  },
  paymentOptions: {
    paymentMethodHandlers: [
      {
        code: 'invoice',
        name: 'Invoice Payment',
        description: 'Pay by invoice',
        args: {},
        createPayment: async (ctx, order, amount, args) => {
          return {
            amount,
            state: 'Authorized',
            metadata: {},
          };
        },
        settlePayment: async (ctx, order, payment) => {
          return {
            success: true,
            metadata: {},
          };
        },
      },
    ],
  },
  shippingOptions: {
    shippingCalculators: [
      {
        code: 'standard-shipping',
        name: 'Standard Shipping',
        description: 'Standard shipping method',
        calculate: async (ctx, order, args) => {
          return {
            price: 1000,
            metadata: {},
          };
        },
      },
    ],
  },
  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: '/tmp/vendure/assets',
      port: PORT,
    }),
    AdminUiPlugin.init({
      route: 'admin',
      port: PORT,
    }),
    EmailPlugin.init({
      devMode: true,
      route: 'email',
      handlers: {
        orderConfirmation: {
          templateFile: 'order-confirmation.hbs',
          subject: 'Order confirmation for {{ order.code }}',
        },
      },
      transport: {
        type: 'smtp',
        host: 'mailcrab',
        port: 1025,
      },
    }),
    DefaultSearchPlugin.init({
      bufferUpdates: false,
      indexPrefix: 'vendure',
    }),
    DefaultJobQueuePlugin.init({
      useDatabaseForBuffer: true,
    }),
  ],
};

/**
 * Bootstrap the Vendure server
 */
bootstrap(config)
  .then(async (app) => {
    await app.get(seedVendure);
    console.log(`Server started at http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error(err);
  }); 