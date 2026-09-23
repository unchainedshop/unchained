import { log } from '@unchainedshop/logger';
import type { Context } from '../../context.ts';

export default function shopSettingsNamespaces(
  root: never,
  _: never,
  { modules, userId }: Context,
): string[] {
  log('query shopSettingsNamespaces', { userId });
  return modules.settings.getRegisteredNamespaces();
}
