import { useIntl } from 'react-intl';

import { useRouter } from 'next/router';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import QuotationList from '../../modules/quotation/components/QuotationList';
import useQuotations from '../../modules/quotation/hooks/useQuotations';
import { convertSortFieldsToQueryFormat } from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import QuotationDetailPage from './QuotationDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';

const Quotations = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const sort = query?.sort || '';

  const { queryString, quotationId, ...rest } = query;

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = rest;
    if (searchString)
      push({
        query: {
          ...withoutSkip,
          queryString: searchString,
        },
      });
    else
      push({
        query: {
          ...rest,
        },
      });
  };

  const sortKeys = convertSortFieldsToQueryFormat(sort);

  const { quotations, quotationsCount, loading, loadMore, hasMore } =
    useQuotations({
      queryString: queryString as string,
      limit,
      offset,
      sort: sortKeys,
    });

  if (quotationId) return <QuotationDetailPage quotationId={quotationId} />;

  const headerText =
    quotationsCount === 1
      ? formatMessage({
          id: 'quotation_header',
          defaultMessage: '1 Quotation',
        })
      : formatMessage(
          {
            id: 'quotation_count_header',
            defaultMessage: '{count} Quotations',
          },
          { count: <AnimatedCounter value={quotationsCount} /> },
        );
  return (
    <>
      <BreadCrumbs />
      <PageHeader
        title={formatMessage(
          {
            id: 'quotation_page_title',
            defaultMessage:
              '{count, plural, one {# Quotation} other {# Quotations}}',
          },
          { count: quotationsCount },
        )}
        headerText={headerText}
      />
      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader />

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          >
            {loading && quotations?.length === 0 ? (
              <Loading />
            ) : (
              <QuotationList sortable quotations={quotations} showUser />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Quotations;
