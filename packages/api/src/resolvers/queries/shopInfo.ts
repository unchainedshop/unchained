import { readFile } from 'fs/promises';
import type { Context } from '../../context.ts';
import { log } from '@unchainedshop/logger';
import { getConfiguredTags } from '../../utils/getConfiguredTags.ts';

export default function shopInfo(
  root: never,
  _: never,
  context: Context,
): {
  version?: string;
  adminUiConfig?: Record<string, any>;
  vapidPublicKey?: string;
} {
  const { adminUiConfig, modules } = context;
  log('query shopInfo', { userId: context.userId });

  return {
    version: context.version,
    adminUiConfig: {
      customProperties: async () => {
        try {
          if (!process.env.UNCHAINED_ADMIN_UI_CUSTOM_PROPERTIES)
            return adminUiConfig?.customProperties ?? [];
          const raw = await readFile(process.env.UNCHAINED_ADMIN_UI_CUSTOM_PROPERTIES, 'utf-8');
          const parsed = JSON.parse(raw);
          return parsed;
        } catch {
          return adminUiConfig?.customProperties ?? [];
        }
      },
      singleSignOnURL:
        process.env.UNCHAINED_ADMIN_UI_SINGLE_SIGN_ON_URL || adminUiConfig?.singleSignOnURL,
      externalLinks: () => {
        try {
          if (!process.env.EXTERNAL_LINKS) return [];
          const parsed = JSON.parse(process.env.EXTERNAL_LINKS);
          return parsed;
        } catch {
          return [];
        }
      },
      productTags: () =>
        getConfiguredTags(
          () => modules.products.existingTags(),
          'UNCHAINED_ADMIN_UI_DEFAULT_PRODUCT_TAGS',
          adminUiConfig?.defaultProductTags,
        ),
      assortmentTags: () =>
        getConfiguredTags(
          () => modules.assortments.existingTags(),
          'UNCHAINED_ADMIN_UI_DEFAULT_ASSORTMENT_TAGS',
          adminUiConfig?.defaultAssortmentTags,
        ),
      userTags: () =>
        getConfiguredTags(
          () => modules.users.existingTags(),
          'UNCHAINED_ADMIN_UI_DEFAULT_USER_TAGS',
          adminUiConfig?.defaultUserTags,
        ),
    },
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}
