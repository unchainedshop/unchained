import { UnchainedCore } from '@unchainedshop/types/core.js';
import { SearchQuery } from '@unchainedshop/types/filters.js';

const defaultSelector = ({ includeInactive }: SearchQuery, { modules }: UnchainedCore) => {
  const selector = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export default defaultSelector;
