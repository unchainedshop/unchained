import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';

export default function shopInfo(
  root: Root,
  _: never,
  context: Context,
): { version?: string; externalLinks: Array<string>; adminUiConfig?: Record<string, any> } {
  const { adminUiConfig } = context;
  log('query shopInfo', { userId: context.userId });
  return {
    version: context.version,
    externalLinks: JSON.parse(process.env.EXTERNAL_LINKS || '[]'),
    adminUiConfig: {
      customProperties: adminUiConfig?.customProperties ?? [],
    },
  };
}

//
