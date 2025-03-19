const dotenv = require('dotenv');

let ENV_FILE_NAME = '';
try {
  ENV_FILE_NAME = '.env';
  dotenv.config({ path: process.cwd() + '/' + ENV_FILE_NAME });
} catch (e) {
  console.log('No .env file found.');
}

// SMTP settings
const SMTP_HOST = process.env.SMTP_HOST || 'localhost';
const SMTP_PORT = process.env.SMTP_PORT || 1025;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@localhost';
const EMAIL_TO = process.env.EMAIL_TO || 'orders@localhost';

// Database settings
const DB_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/medusa';
// Redis settings
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

module.exports = {
  projectConfig: {
    redis_url: REDIS_URL,
    database_url: DB_URL,
    database_type: 'postgres',
    store_cors: process.env.STORE_CORS || 'http://localhost:8000,http://localhost:3000',
    admin_cors: process.env.ADMIN_CORS || 'http://localhost:7000,http://localhost:7001',
    database_extra: { ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false },
    jwt_secret: process.env.JWT_SECRET || 'medusa-benchmark-secret-jwt',
    cookie_secret: process.env.COOKIE_SECRET || 'medusa-benchmark-secret-cookie',
  },
  plugins: [
    `medusa-fulfillment-manual`,
    `medusa-payment-manual`,
    {
      resolve: `medusa-file-local`,
      options: {
        upload_dir: 'uploads',
      },
    },
    {
      resolve: `medusa-plugin-sendgrid`,
      options: {
        api_key: process.env.SENDGRID_API_KEY || 'SG.fake',
        from: EMAIL_FROM,
        order_placed_template: 'order-confirmation',
        localization: {
          'order-confirmation': {
            en: {
              subject: 'Order Confirmation',
            },
          },
        },
        smtp_settings: {
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: false,
          auth: {
            user: '',
            pass: '',
          },
        },
      },
    },
  ],
}; 