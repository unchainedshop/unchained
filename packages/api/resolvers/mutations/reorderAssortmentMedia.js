import { log } from 'unchained-logger';
import { AssortmentMedia } from 'meteor/unchained:core-assortments';

export default function reorderAssortmentMedia(
  root,
  { sortKeys = [] },
  { userId }
) {
  log('mutation reorderAssortmentMedia', { userId });
  return AssortmentMedia.updateManualOrder({ sortKeys });
}
