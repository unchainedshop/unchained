import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { IOAuth2Adapter } from '@unchainedshop/types/accounts.js';

export default function shopInfo(
  root: Root,
  _: never,
  context: Context,
): {
  activities?: () => Promise<any>;
  version?: string;
  externalLinks: () => Array<string>;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
  oAuthProviders?: () => Promise<Array<IOAuth2Adapter>>;
} {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });

  return {
    version: context.version,
    externalLinks: () => {
      try {
        const parsed = JSON.parse(process.env.EXTERNAL_LINKS);
        return parsed;
      } catch {
        return [];
      }
    },
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
    },
    async oAuthProviders() {
      return context.modules.accounts.oAuth2.getProviders();
    },
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
