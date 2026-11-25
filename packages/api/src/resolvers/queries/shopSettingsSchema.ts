import { log } from '@unchainedshop/logger';
import type { Context } from '../../context.ts';

export default function shopSettingsSchema(
  root: never,
  { namespace }: { namespace: string },
  { modules, userId }: Context,
): Record<string, unknown> | null {
  log('query shopSettingsSchema', { namespace, userId });
  return modules.settings.getJsonSchema(namespace);
}
