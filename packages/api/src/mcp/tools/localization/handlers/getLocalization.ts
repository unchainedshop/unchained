import { Context } from '../../../../context.js';
import { getLocalizationsConfig } from '../getLocalizationsConfig.js';
import { Params } from '../schemas.js';

export default async function getLocalization(context: Context, params: Params<'GET'>) {
  const { localizationType, entityId } = params;
  const config = getLocalizationsConfig(context, localizationType);
  const entity = await config.findMethod({ [config.idField]: entityId });

  if (!entity) {
    return { [config.entityName]: null, message: `${localizationType} not found for ID: ${entityId}` };
  }

  return { [config.entityName]: entity, localizationType };
}
