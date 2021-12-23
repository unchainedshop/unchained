import { log } from 'meteor/unchained:logger';
import { searchProducts } from 'meteor/unchained:core-filters';
import { QueryStringRequiredError } from '../../../errors';
import { Root } from '@unchainedshop/types/api';
import { Context } from 'vm';

export default async function searchQuery(
  root: Root,
  query: {
    queryString: string;
    assortmentId: string;
    ignoreChildAssortments: Array<string>;
  },
  { modules, userId }: Context
) {
  const forceLiveCollection = false;
  const { queryString, assortmentId, ignoreChildAssortments } = query;

  log(`query search ${assortmentId} ${JSON.stringify(query)}`, { userId });
  
  if (assortmentId) {
    const assortment = await modules.assortments.find({ assortmentId });    
    return assortment?.searchProducts({
      query,
      forceLiveCollection,
      ignoreChildAssortments,
      context,
    });
  }

  if (!queryString) throw new QueryStringRequiredError({});
  return searchProducts({ query, forceLiveCollection, context });
}
