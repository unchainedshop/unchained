import { createLogger } from '@unchainedshop/logger';
import type { IPlugin } from '@unchainedshop/core';
import { MinioAdapter } from './adapter.ts';
import { minioWebhookHandler } from './api.ts';

const logger = createLogger('unchained:minio');

const { MINIO_WEBHOOK_AUTH_TOKEN, MINIO_WEBHOOK_PATH = '/minio/webhook' } = process.env;

// Plugin definition
export const MinioPlugin: IPlugin = {
  key: 'shop.unchained.file-upload-plugin.minio',
  label: 'Minio/S3 File Upload Plugin with Webhook',
  version: '1.1.0',

  adapters: [MinioAdapter],

  routes: [
    {
      path: MINIO_WEBHOOK_PATH,
      method: 'POST',
      handler: minioWebhookHandler,
    },
  ],

  onRegister: () => {
    if (!MINIO_WEBHOOK_AUTH_TOKEN) {
      logger.warn('MINIO_WEBHOOK_AUTH_TOKEN not set - webhooks will be disabled');
    }
  },
};

export default MinioPlugin;

// Re-export adapter for direct use
export { MinioAdapter, connectToMinio } from './adapter.ts';
