import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

const { EXTERNAL_LINKS = '[]' } = process.env;

export default function shopInfo(
  root: Root,
  _: never,
  context: Context,
): {
  version?: string;
  externalLinks: Array<string>;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
} {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });

  return {
    version: context.version,
    externalLinks: JSON.parse(EXTERNAL_LINKS),
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
    },
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
