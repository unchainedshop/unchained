import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { SettingsNamespaceNotFoundError, SettingsValidationError } from '../../../errors.ts';

export default async function updateShopSettings(
  root: never,
  { namespace, value }: { namespace: string; value: Record<string, unknown> },
  { modules, userId }: Context,
): Promise<Record<string, unknown>> {
  log(`mutation updateShopSettings for ${namespace}`, { userId });

  if (!modules.settings.getNamespaceDefinition(namespace)) {
    throw new SettingsNamespaceNotFoundError({ namespace });
  }

  try {
    return await modules.settings.set(namespace, value);
  } catch (error) {
    if (error?.name === 'ZodError') {
      throw new SettingsValidationError({
        namespace,
        message: (error as Error).message,
      });
    }
    throw error;
  }
}
