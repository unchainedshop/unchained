import type { McpServer } from '@modelcontextprotocol/server';
import { acl, getCurrentSchema, NoPermissionError, roles, type Context } from '@unchainedshop/api';
import { FilterDirector } from '@unchainedshop/core';
import type { Product } from '@unchainedshop/core-products';
import { z } from 'zod';
import { resolveStorefrontMarket, type StorefrontMarket } from './market.ts';
import { productResults, type ProductUrlBuilder } from './results.ts';
import type { StorefrontMcpTool, StorefrontMcpView } from './index.ts';

const RANGE_SYNTAX =
  'Inclusive range lower:upper, either bound may be left out (:5000 or 5000:), a value without a colon matches exactly.';

const BUILT_IN_INPUTS = ['query', 'product_ids', 'sort', 'offset', 'limit'];
const INPUT_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export interface StorefrontSearch {
  queryString?: string;
  filterQuery?: { key: string; value: string }[];
  productIds?: string[];
  orderBy?: string;
  offset?: number;
  limit?: number;
}

export async function searchStorefrontProducts(
  context: Context,
  { offset = 0, limit = 20, ...query }: StorefrontSearch,
  market: StorefrontMarket,
  productUrl: ProductUrlBuilder,
) {
  const searchQuery = { ...query, includeInactive: false, strictFilterQuery: true };
  await acl.checkAction(context, roles.actions.search, [undefined, searchQuery]);
  const { searchConfiguration, aggregatedFilteredProductIds: productIds } =
    await context.services.filters.searchProducts(searchQuery, {
      ...market,
      userId: context.userId,
    });
  const { productSelector, sortStage } = searchConfiguration;
  const [products, totalCount]: [Product[], number] = productIds.length
    ? await Promise.all([
        context.modules.products.search.findFilteredProducts({
          limit,
          offset,
          productIds,
          productSelector,
          sort: sortStage,
        }),
        context.modules.products.search.countFilteredProducts({ productIds, productSelector }),
      ])
    : [[], 0];
  return {
    market: {
      country: market.countryCode,
      language: market.locale.language,
      currency: market.currencyCode,
    },
    totalCount,
    products: await productResults(context, products, market, productUrl),
  };
}

async function exposedInputs(context: Context, filterKeys: Record<string, string>) {
  const { modules, loaders, locale } = context;
  try {
    await acl.checkAction(context, roles.actions.viewFilters, [undefined, { includeInactive: false }]);
  } catch (error) {
    if (error instanceof NoPermissionError) return [];
    throw error;
  }
  const filters = await modules.filters.findFilters({
    key: { $in: Object.values(filterKeys) },
    limit: 0,
  });
  const inputs = await Promise.all(
    Object.entries(filterKeys).map(async ([name, key]) => {
      const filter = filters.find((candidate) => candidate.key === key);
      if (!filter) return null;
      const options = filter.type === 'RANGE' ? [] : await FilterDirector.optionValues(filter);
      const choice = options.length ? z.enum(options as [string, ...string[]]) : null;
      const schema = {
        SWITCH: z.boolean(),
        RANGE: z.string().min(1).max(64),
        SINGLE_CHOICE: choice,
        MULTI_CHOICE: choice && z.array(choice).min(1),
      }[filter.type];
      if (!schema) return null;
      const texts = await loaders.filterTextLoader.load({
        filterId: filter._id,
        filterOptionValue: null,
        locale,
      });
      const description = [texts?.title, texts?.subtitle, filter.type === 'RANGE' && RANGE_SYNTAX]
        .filter(Boolean)
        .join('. ');
      return { name, filter, schema: schema.optional().describe(description) };
    }),
  );
  return inputs.filter((input) => input !== null);
}

const shopSortOrders = () => {
  const schema = getCurrentSchema() as { getType?: (name: string) => unknown } | undefined;
  const searchOrderBy = schema?.getType?.('SearchOrderBy') as
    { getValues?: () => { name: string; value: unknown }[] } | undefined;
  return new Map(
    (searchOrderBy?.getValues?.() ?? [])
      .filter(({ name, value }) => name !== 'default' && typeof value === 'string')
      .map(({ name, value }) => [name, value as string]),
  );
};

const toolError = (text: string) => ({ isError: true, content: [{ type: 'text' as const, text }] });

export function createProductSearchTool({
  productUrl,
  inputs: filterKeys = {},
  ui,
}: {
  productUrl: ProductUrlBuilder;
  inputs?: Record<string, string>;
  ui?: StorefrontMcpView;
}): StorefrontMcpTool {
  const invalidNames = Object.keys(filterKeys).filter(
    (name) => !INPUT_NAME.test(name) || BUILT_IN_INPUTS.includes(name),
  );
  if (invalidNames.length) {
    throw new Error(
      `Invalid search inputs ${invalidNames.join(', ')}: use a letter followed by letters, digits or _ (at most 64 characters), other than ${BUILT_IN_INPUTS.join(', ')}`,
    );
  }

  return {
    ui,
    async register(server: McpServer, context: Context) {
      const inputs = await exposedInputs(context, filterKeys);
      const sortOrders = shopSortOrders();
      const shape = {
        ...Object.fromEntries(inputs.map(({ name, schema }) => [name, schema])),
        query: z
          .string()
          .trim()
          .min(1)
          .max(500)
          .optional()
          .describe('Free-text search, omit to browse.'),
        product_ids: z
          .array(z.string().min(1))
          .min(1)
          .max(100)
          .optional()
          .describe('IDs of earlier results, to show the products a shopper refers to.'),
        ...(sortOrders.size && {
          sort: z.enum([...sortOrders.keys()] as [string, ...string[]]).optional(),
        }),
        offset: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(100).default(20),
      };
      const acceptedInputs = Object.keys(shape).join(', ');

      server.registerTool(
        'search_products',
        {
          title: 'Search products',
          description:
            'Searches this shop’s catalog. Results carry the market, prices and a link to each product in the shop.',
          inputSchema: z.strictObject(shape, {
            error: (issue) =>
              issue.code === 'unrecognized_keys'
                ? `Unknown input ${issue.keys.join(', ')}, accepted inputs: ${acceptedInputs}`
                : undefined,
          }),
          annotations: { readOnlyHint: true, openWorldHint: false },
          ...(ui && {
            _meta: {
              ui: { resourceUri: ui.uri },
              'openai/outputTemplate': ui.uri,
              'openai/ui': { preferredModelDisplayMode: 'inline' },
            },
          }),
        },
        async ({ query, product_ids, sort, offset, limit, ...selected }, ctx) => {
          const market = await resolveStorefrontMarket(context, ctx.mcpReq._meta);
          const filterQuery = Object.entries(selected).flatMap(([name, value]) => {
            const { key } = inputs.find((input) => input.name === name)!.filter;
            return [value].flat().map((option) => ({ key, value: String(option) }));
          });
          try {
            const result = await searchStorefrontProducts(
              context,
              {
                queryString: query,
                productIds: product_ids,
                orderBy: typeof sort === 'string' ? sortOrders.get(sort) : undefined,
                filterQuery,
                offset,
                limit,
              },
              market,
              productUrl,
            );
            return {
              structuredContent: result,
              content: [{ type: 'text', text: JSON.stringify(result) }],
            };
          } catch (error) {
            if (error instanceof NoPermissionError) return toolError(error.message);
            if ((error as Error).cause !== 'FILTER_NOT_APPLICABLE') throw error;
            const filterActions = await FilterDirector.actions({ searchQuery: {} }, context);
            const selector = await filterActions.transformFilterSelector({ isActive: true }, market);
            const applicableFilterIds = selector
              ? (await context.modules.filters.findFilters({ ...selector, limit: 0 })).map(
                  ({ _id }) => _id,
                )
              : [];
            const applicableInputs = inputs
              .filter(({ filter }) => applicableFilterIds.includes(filter._id))
              .map(({ name }) => name);
            const inapplicableInputs = Object.keys(selected).filter(
              (name) => !applicableInputs.includes(name),
            );
            return toolError(
              `${inapplicableInputs.join(', ')} does not apply to the ${market.countryCode} market, filter inputs for this market: ${applicableInputs.join(', ') || 'none'}`,
            );
          }
        },
      );
    },
  };
}
