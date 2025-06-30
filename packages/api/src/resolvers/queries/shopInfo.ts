import { Context } from '../../context.js';
import { log } from '@unchainedshop/logger';

export default function shopInfo(
  root: never,
  _: never,
  context: Context,
): {
  version?: string;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
} {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });

  return {
    version: context.version,
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
      singleSignOnURL: adminUiConfig?.singleSignOnURL,
      externalLinks: () => {
        try {
          const parsed = JSON.parse(process.env.EXTERNAL_LINKS);
          return parsed;
        } catch {
          return [];
        }
      },
    },
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
