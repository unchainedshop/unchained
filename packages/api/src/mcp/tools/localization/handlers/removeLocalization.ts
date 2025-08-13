import { Context } from '../../../../context.js';
import { getLocalizationConfig } from '../../../modules/configureLocalizationMcpModule.js';
import { Params } from '../schemas.js';

export default async function removeLocalization(context: Context, params: Params<'REMOVE'>) {
  const { localizationType, entityId } = params;
  const config = getLocalizationConfig(context, localizationType);
  const findParam = { [config.idField]: entityId };
  const existing = await config.findMethod(findParam);

  if (!existing) throw new config.NotFoundError(findParam);

  await config.module.delete(entityId);
  return { [config.entityName]: existing, localizationType };
}
