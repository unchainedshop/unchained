import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import {
  Loading,
  NoData,
  PageHeader,
  ListHeader,
  AnimatedCounter,
  SearchField,
} from '@unchainedshop/admin-ui/ui';
import TicketEventList from '../components/TicketEventList';
import useEventProducts from '../hooks/useEventProducts';

const TicketingPage = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();

  const { queryString, ...rest } = query;

  const setQueryString = (searchString) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      <div className="mt-5 inline-block min-w-full overflow-x-auto px-1 pb-5">
        <ListHeader />
        <div className="my-3">
          <SearchField onInputChange={setQueryString} defaultValue={queryString} />
        </div>
        {loading ? <Loading /> : <TicketEventList products={products} />}
        {!loading && !products?.length && (
          <NoData
            message={formatMessage({
              id: 'no_events',
              defaultMessage: 'No tokenized products (events) found',
            })}
          />
        )}
      </div>
    </>
  );
};

export default TicketingPage;
