import type { Context } from '../../../../context.ts';
import { getLocalizationsConfig } from '../getLocalizationsConfig.ts';
import type { Params } from '../schemas.ts';

export default async function countLocalizations(context: Context, params: Params<'COUNT'>) {
  const { localizationType, includeInactive = false, queryString } = params;
  const config = getLocalizationsConfig(context, localizationType);

  const count = await config.module.count({
    includeInactive,
    queryString,
  });

  return { count, localizationType };
}
