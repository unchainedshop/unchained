import { Context } from '../../../../context.js';
import { getProviderConfig } from '../utils/getProviderConfig.js';
import { Params } from '../schemas.js';

export default async function listProviders(context: Context, params: Params<'LIST'>) {
  const { providerType, typeFilter, queryString } = params;
  const config = getProviderConfig(context, providerType);
  const selector: Record<string, any> = {};
  if (typeFilter) selector.type = typeFilter;

  if (queryString) {
    const regex = new RegExp(queryString, 'i');
    selector.$or = [{ _id: regex }, { adapterKey: regex }];
  }

  const providers = await config.module.findProviders(selector);
  return { providers };
}
