import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import Loading from '../../modules/common/components/Loading';
import NoData from '../../modules/common/components/NoData';
import ListHeader from '../../modules/common/components/ListHeader';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import TicketEventList from '../../modules/ticketing/components/TicketEventList';
import useEventProducts from '../../modules/ticketing/hooks/useEventProducts';
import TicketEventDetailPage from './TicketEventDetailPage';

const TicketingPage = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();

  const { queryString, slug, ...rest } = query;

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

  const { products, productsCount, loading } = useEventProducts({
    limit: 0,
    offset: 0,
    queryString: queryString as string,
  });

  if (slug) return <TicketEventDetailPage slug={slug} />;

  const headerText =
    productsCount === 1
      ? formatMessage({
          id: 'event_header',
          defaultMessage: '1 Event',
        })
      : formatMessage(
          {
            id: 'event_count_header',
            defaultMessage: '{count} Events',
          },
          { count: <AnimatedCounter value={productsCount} /> },
        );

  return (
    <>
      <BreadCrumbs />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title={formatMessage(
            {
              id: 'ticketing_page_title',
              defaultMessage: '{count, plural, one {# Event} other {# Events}}',
            },
            { count: productsCount },
          )}
          headerText={headerText}
        />
        <Link
          href="/ticketing/gate"
          className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-950"
        >
          {formatMessage({
            id: 'gate_control',
            defaultMessage: 'Gate Control',
          })}
        </Link>
      </div>
      <div className="mt-5 inline-block min-w-full overflow-x-auto px-1 pb-5">
        <ListHeader />

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <>
            {loading ? <Loading /> : <TicketEventList products={products} />}
            {!loading && !products?.length && (
              <NoData
                message={formatMessage({
                  id: 'no_events',
                  defaultMessage: 'No tokenized products (events) found',
                })}
              />
            )}
          </>
        </SearchWithTags>
      </div>
    </>
  );
};

export default TicketingPage;
