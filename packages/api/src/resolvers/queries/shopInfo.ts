import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { Oauth2Director } from '@unchainedshop/core-accountsjs';
import { OauthConfig } from '@unchainedshop/types/accounts.js';

export default function shopInfo(
  root: Root,
  _: never,
  context: Context,
): {
  version?: string;
  externalLinks: Array<string>;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
  oauthProviders?: Array<OauthConfig>;
} {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });

  const oauthProviders = Oauth2Director.getAdapters().map((adapter) => ({
    name: adapter?.provider,
    clientId: adapter?.config?.clientId,
    scopes: adapter?.config?.scopes || [],
  }));
  return {
    version: context.version,
    externalLinks: JSON.parse(process.env.EXTERNAL_LINKS || '[]'),
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
    },
    oauthProviders,
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
