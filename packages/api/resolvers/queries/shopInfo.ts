import { Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import type { UnchainedServerContext } from '../../api';

export default function shopInfo(
  root: Root,
  _: never,
  context: UnchainedServerContext
): { version: string; externalLinks: any[] } {
  log('query shopInfo', { userId: context.userId });
  return {
    version: context.version,
    externalLinks: JSON.parse(process.env.EXTERNAL_LINKS || '[]'),
  };
}
