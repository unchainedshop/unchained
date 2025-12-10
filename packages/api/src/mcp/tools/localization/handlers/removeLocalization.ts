import type { Context } from '../../../../context.ts';
import { getLocalizationsConfig } from '../getLocalizationsConfig.ts';
import type { Params } from '../schemas.ts';

export default async function removeLocalization(context: Context, params: Params<'REMOVE'>) {
  const { localizationType, entityId } = params;
  const config = getLocalizationsConfig(context, localizationType);
  const findParam = { [config.idField]: entityId };
  const existing = await config.findMethod(findParam);

  if (!existing) throw new config.NotFoundError(findParam);

  await config.module.delete(entityId);
  return { success: true };
}
