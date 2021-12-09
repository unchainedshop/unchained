import { log } from 'meteor/unchained:logger';
import { AssortmentProducts } from 'meteor/unchained:core-assortments';

export default function reorderAssortmentProducts(
  root,
  { sortKeys = [] },
  { userId }
) {
  log('mutation reorderAssortmentProducts', { userId });
  return AssortmentProducts.updateManualOrder({ sortKeys });
}
