import { useIntl } from 'react-intl';
import { IRoleAction } from '../../gql/types';

import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import PageHeader from '../../modules/common/components/PageHeader';
import Toggle from '../../modules/common/components/Toggle';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import ProductList from '../../modules/product/components/ProductList';
import useAuth from '../../modules/Auth/useAuth';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import useProductsCount from '../../modules/product/hooks/useProductsCount';
import ProductDetailPage from './ProductDetailPage';
import LocaleWrapper from '../../modules/common/components/LocaleWrapper';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import ProductExport from '../../modules/product/components/ProductExport';
import ProductImport from '../../modules/product/components/ProductImport';
import useApp from '../../modules/common/hooks/useApp';

const Products = () => {
  const { formatMessage } = useIntl();
  const { shopInfo } = useApp();
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const includeDrafts =
    query?.includeDrafts === 'true' || !query?.includeDrafts;
  const tags = (query.tags as string)?.split(',') || undefined;
  const sort = query.sort || '';
  const { hasRole } = useAuth();
  const { queryString, slug, ...restQuery } = query;

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = restQuery;
    if (searchString) {
      push({
        query: normalizeQuery(withoutSkip, searchString, 'queryString'),
      });
    } else {
      push({
        query: normalizeQuery(restQuery),
      });
    }
  };
  const sortKeys = convertSortFieldsToQueryFormat(sort);
  const { productsCount } = useProductsCount({
    queryString: queryString as string,
    includeDrafts,
    tags,
  });

  if (slug) return <ProductDetailPage slug={slug} />;
  const headerText =
    productsCount === 1
      ? formatMessage({
          id: 'products_header',
          defaultMessage: '1 Product',
        })
      : formatMessage(
          {
            id: 'products_count_header',
            defaultMessage: '{count} Products',
          },
          { count: <AnimatedCounter value={productsCount ?? 0} /> },
        );

  const tagFilterOptions = (shopInfo?.adminUiConfig?.productTags || []).map(
    (tag) => ({ value: tag, label: tag }),
  );
  return (
    <>
      <BreadCrumbs />
      <div className="w-full">
        <PageHeader
          title={formatMessage(
            {
              id: 'product_page_title',
              defaultMessage:
                '{count, plural, one {# Product} other {# Products}}',
            },

            { count: productsCount },
          )}
          headerText={headerText}
          addPath={hasRole(IRoleAction.ManageProducts) && '/products/new'}
          addButtonText={formatMessage({
            id: 'add_product',
            defaultMessage: 'Add Product',
          })}
        >
          <ProductExport
            includeDrafts={includeDrafts}
            queryString={queryString as string}
            tags={tags}
          />
          <ProductImport />
        </PageHeader>
      </div>
      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader>
          <Toggle
            toggleText={formatMessage({
              id: 'include_drafts',
              defaultMessage: 'Include drafts',
            })}
            toggleKey="includeDrafts"
            active={includeDrafts}
          />
        </ListHeader>
        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
          showTagFilter
          availableTagOptions={tagFilterOptions}
        >
          <LocaleWrapper onlyFull>
            <ProductList
              sortable
              {...{ queryString, includeDrafts, limit, offset, tags, sortKeys }}
            />
          </LocaleWrapper>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Products;
