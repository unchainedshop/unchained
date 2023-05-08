import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { OAuth2Director } from '@unchainedshop/core-accountsjs';
import { OAuthConfig } from '@unchainedshop/types/accounts.js';

export default function shopInfo(
  root: Root,
  _: never,
  context: Context,
): {
  version?: string;
  externalLinks: Array<string>;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
  oAuthProviders?: Array<OAuthConfig>;
} {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });

  const oAuthProviders = OAuth2Director.getAdapters().map((adapter) => ({
    _id: adapter.provider,
    clientId: adapter.config?.clientId,
    scopes: adapter.config?.scopes || [],
  }));
  return {
    version: context.version,
    externalLinks: JSON.parse(process.env.EXTERNAL_LINKS || '[]'),
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
    },
    oAuthProviders,
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
