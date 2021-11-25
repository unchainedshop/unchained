import { log } from 'meteor/unchained:logger';
import { ProductMedia } from 'meteor/unchained:core-products';

export default function reorderProductMedia(
  root,
  { sortKeys = [] },
  { userId }
) {
  log('mutation reorderProductMedia', { userId });
  return ProductMedia.updateManualOrder({ sortKeys });
}
