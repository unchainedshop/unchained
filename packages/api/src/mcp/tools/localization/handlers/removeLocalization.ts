import { Context } from '../../../../context.js';
import { getLocalizationsConfig } from '../getLocalizationsConfig.js';
import { Params } from '../schemas.js';

export default async function removeLocalization(context: Context, params: Params<'REMOVE'>) {
  const { localizationType, entityId } = params;
  const config = getLocalizationsConfig(context, localizationType);
  const findParam = { [config.idField]: entityId };
  const existing = await config.findMethod(findParam);

  if (!existing) throw new config.NotFoundError(findParam);

  await config.module.delete(entityId);
  return { success: true };
}
