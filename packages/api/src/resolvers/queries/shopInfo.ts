import { Context } from '../../types.js';
import { log } from '@unchainedshop/logger';

export default function shopInfo(
  root: never,
  _: never,
  context: Context,
): {
  version?: string;
  externalLinks: () => Array<string>;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
} {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });

  return {
    version: context.version,
    externalLinks: () => {
      try {
        const parsed = JSON.parse(process.env.EXTERNAL_LINKS);
        return parsed;
      } catch (e) {
        return [];
      }
    },
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
    },
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
