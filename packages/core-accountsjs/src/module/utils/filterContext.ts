import { UnchainedCore } from '@unchainedshop/types/core';

const EXCLUDED_CONTEXT_FIELDS = ['modules', 'services', 'bulkImporter', 'loaders', 'req', 'res'];

export const filterContext = (graphqlContext): UnchainedCore => {
  // TODO: Type!
  return Object.fromEntries(
    Object.entries(graphqlContext).filter(([key]) => {
      if (EXCLUDED_CONTEXT_FIELDS.includes(key)) return false;
      if (key.substring(0, 1) === '_') return false;
      return true;
    }),
  ) as any;
};
