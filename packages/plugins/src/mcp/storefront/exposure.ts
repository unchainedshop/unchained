import { acl, createError, FilterNotFoundError, type Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import type { mongodb } from '@unchainedshop/mongodb';

const logger = createLogger('unchained:storefront-mcp');

export const BUILT_IN_INPUTS = ['query', 'product_ids', 'sort', 'offset', 'limit'];
const INPUT_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export const isValidInputName = (name: unknown): name is string =>
  typeof name === 'string' && INPUT_NAME.test(name) && !BUILT_IN_INPUTS.includes(name);

export const searchInputOf = (filter: { meta?: any }): string | undefined =>
  filter.meta?.storefrontSearchInput;

export const exposedFilterSelector = { 'meta.storefrontSearchInput': { $type: 'string' } };

const InvalidSearchInputError = createError(
  'InvalidStorefrontSearchInputError',
  `Use a letter followed by letters, digits or _ (at most 64 characters), other than ${BUILT_IN_INPUTS.join(', ')}`,
);
const SearchInputInUseError = createError(
  'StorefrontSearchInputInUseError',
  'Another filter already uses this name',
);

export const createSearchInputIndex = (db: mongodb.Db) =>
  db
    .collection('filters')
    .createIndex(
      { 'meta.storefrontSearchInput': 1 },
      { unique: true, partialFilterExpression: exposedFilterSelector },
    )
    .catch((error) => {
      logger.warn('Exposed filter names are not unique, saving duplicates will not be rejected', {
        error: error.message,
      });
    });

export const storefrontMcpTypeDefs = [
  /* GraphQL */ `
    extend type Filter {
      storefrontSearchInput: String
    }

    extend type Mutation {
      setFilterStorefrontSearchInput(filterId: ID!, name: String): Filter!
    }
  `,
];

export const storefrontMcpResolvers = {
  Filter: {
    storefrontSearchInput: (filter: { meta?: any }) => searchInputOf(filter) ?? null,
  },
  Mutation: {
    setFilterStorefrontSearchInput: acl.checkResolver('manageFilters')(
      async (
        _root: never,
        { filterId, name }: { filterId: string; name?: string | null },
        { modules, services }: Context,
      ) => {
        const filter = await modules.filters.findFilter({ filterId });
        if (!filter) throw new FilterNotFoundError({ filterId });
        if (name != null && !isValidInputName(name)) throw new InvalidSearchInputError({ name });

        const meta = filter.meta && typeof filter.meta === 'object' ? filter.meta : {};
        try {
          return await services.filters.updateFilter(filterId, {
            meta: { ...meta, storefrontSearchInput: name ?? null },
          });
        } catch (error) {
          if ((error as { code?: number }).code !== 11000) throw error;
          const [owner] = await modules.filters.findFilters({
            'meta.storefrontSearchInput': name,
            includeInactive: true,
            limit: 1,
          });
          throw new SearchInputInUseError({ name, filterKey: owner?.key });
        }
      },
    ),
  },
};
