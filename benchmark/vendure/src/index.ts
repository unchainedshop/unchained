import { bootstrap, JobQueueService } from '@vendure/core';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { EmailPlugin } from '@vendure/email-plugin';
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
    adminApiPlayground: {
      settings: { 'request.credentials': 'include' },
    },
    adminApiDebug: true,
    shopApiPlayground: {
      settings: { 'request.credentials': 'include' },
    },
    shopApiDebug: true,
  },
  authOptions: {
    tokenMethod: ['bearer', 'cookie'],
    superadminCredentials: {
      identifier: 'admin',
      password: 'admin',
    },
    cookieOptions: {
      secret: 'your-secret',
    },
  },
  dbConnectionOptions: {
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres',
    port: 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'vendure',
    synchronize: true,
  },
  paymentOptions: {
    paymentMethodHandlers: [
      {
        code: 'invoice-payment',
        description: [{ languageCode: 'en', value: 'Pay by invoice' }],
        args: {},
        createPayment: (order, args, metadata) => {
          return {
            amount: order.total,
            state: 'Settled',
            transactionId: '12345',
            metadata: metadata,
          };
        },
      },
    ],
  },
  shippingOptions: {
    shippingCalculators: [
      {
        code: 'standard-shipping',
        description: [{ languageCode: 'en', value: 'Standard Shipping' }],
        args: {},
        calculate: (order, args) => {
          return {
            price: 500,
            priceWithTax: 500,
            metadata: {},
          };
        },
      },
    ],
  },
  plugins: [
    AssetServerPlugin.init({
      route: 'assets',
      assetUploadDir: join(__dirname, '../static/assets'),
      storageStrategyFactory: () => {
        return {
          toAbsoluteUrl: (request, identifier) => {
            return `${request.protocol}://${request.get('host')}/assets/${identifier}`;
          },
          writeFileFromBuffer: async (file) => {
            // This is a placeholder - in a real implementation we would write the file to disk
            return `${file.filename}-${Date.now()}`;
          },
          readFileToBuffer: async (identifier) => {
            // This is a placeholder - in a real implementation we would read the file from disk
            return Buffer.from('placeholder');
          },
          deleteFile: async (identifier) => {
            // This is a placeholder - in a real implementation we would delete the file from disk
            return true;
          },
        };
      },
    }),
    AdminUiPlugin.init({
      route: 'admin',
      port: PORT,
    }),
    EmailPlugin.init({
      devMode: true,
      route: 'mailbox',
      handlers: [],
      templatePath: join(__dirname, '../static/email-templates'),
      outputPath: join(__dirname, '../static/email-templates/output'),
      globalTemplateVars: {
        fromAddress: '"example" <noreply@example.com>',
        verifyEmailAddressUrl: 'https://example.com/verify',
        passwordResetUrl: 'https://example.com/reset-password',
        changeEmailAddressUrl: 'https://example.com/verify-email-address-change'
      },
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