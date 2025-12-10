import { readFile } from 'fs/promises';
import type { Context } from '../../context.ts';
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
      productTags: async () => {
        const existingProductTags = await modules.products.existingTags();
        const envTags = (process.env.UNCHAINED_ADMIN_UI_DEFAULT_PRODUCT_TAGS || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        const normalizedDefaultTags = envTags?.length
          ? envTags
          : (adminUiConfig?.defaultProductTags || []).filter(Boolean);
        const normalizedTags = Array.from(new Set(normalizedDefaultTags.concat(existingProductTags)));
        return normalizedTags;
      },
      assortmentTags: async () => {
        const existingAssortmentTags = await modules.assortments.existingTags();
        const envTags = (process.env.UNCHAINED_ADMIN_UI_DEFAULT_ASSORTMENT_TAGS || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        const normalizedDefaultTags = envTags?.length
          ? envTags
          : (adminUiConfig?.defaultAssortmentTags || []).filter(Boolean);
        const normalizedTags = Array.from(new Set(normalizedDefaultTags.concat(existingAssortmentTags)));
        return normalizedTags;
      },
      userTags: async () => {
        const existingUserTags = await modules.users.existingTags();
        const envTags = (process.env.UNCHAINED_ADMIN_UI_DEFAULT_USER_TAGS || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        const normalizedDefaultTags = envTags?.length
          ? envTags
          : (adminUiConfig?.defaultUserTags || []).filter(Boolean);
        const normalizedTags = Array.from(new Set(normalizedDefaultTags.concat(existingUserTags)));
        return normalizedTags;
      },
    },
    vapidPublicKey: process.env?.PUSH_NOTIFICATION_PUBLIC_KEY,
  };
}

//
