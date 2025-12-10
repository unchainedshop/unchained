import type { Context } from '../../../../context.ts';
import { getLocalizationsConfig } from '../getLocalizationsConfig.ts';
import type { Params } from '../schemas.ts';

export default async function listLocalizations(context: Context, params: Params<'LIST'>) {
  const {
    localizationType,
    limit = 50,
    offset = 0,
    includeInactive = false,
    queryString,
    sort,
  } = params;
  const config = getLocalizationsConfig(context, localizationType);

  const sortOptions =
    sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
    undefined;

  const entities = await config.findMultipleMethod({
    limit,
    offset,
    includeInactive,
    queryString,
    sort: sortOptions,
  });

  const mapper = {
    COUNTRY: 'countries',
    CURRENCY: 'currencies',
    LANGUAGE: 'languages',
  };
  const pluralEntityName = mapper[localizationType] || `${config.entityName}s`;

  return { [pluralEntityName]: entities, localizationType };
}
