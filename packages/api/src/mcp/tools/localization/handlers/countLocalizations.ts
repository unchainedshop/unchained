import { Context } from '../../../../context.js';
import { getLocalizationConfig } from '../../../modules/configureLocalizationMcpModule.js';
import { Params } from '../schemas.js';

export default async function countLocalizations(context: Context, params: Params<'COUNT'>) {
  const { localizationType, includeInactive = false, queryString } = params;
  const config = getLocalizationConfig(context, localizationType);

  const count = await config.module.count({
    includeInactive,
    queryString,
  });

  return { count, localizationType };
}
