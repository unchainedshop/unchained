import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import Toggle from '../../modules/common/components/Toggle';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import OrderList from '../../modules/order/components/OrderList';
import useOrders from '../../modules/order/hooks/useOrders';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import OrderDetailPage from './OrderDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import OrderFilters from '../../modules/order/components/OrderFilters';
import {
  IDeliveryProviderType,
  IOrderStatus,
  IPaymentProviderType,
} from '../../gql/types';
import usePaymentProviders from '../../modules/payment-providers/hooks/usePaymentProviders';
import useDeliveryProviders from '../../modules/delivery-provider/hooks/useDeliveryProviders';

const Orders = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();

  const { paymentProviders } = usePaymentProviders();
  const { deliveryProviders } = useDeliveryProviders();
  const paymentInterfaces = paymentProviders.map((provider) => ({
    value: provider._id,
    label: provider.interface.label,
  }));
  const deliveryInterfaces = deliveryProviders.map((provider) => ({
    value: provider._id,
    label: provider.interface.label,
  }));

  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const includeCarts = query?.includeCarts === 'true';
  const sort = query?.sort || '';
  const { queryString, orderId, ...restQuery } = query;

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
  const { orders, ordersCount, loading, loadMore, hasMore } = useOrders({
    limit,
    includeCarts,
    queryString: queryString as string,
    offset,
    sort: sortKeys,
    dateRange:
      query?.start || query?.end
        ? { start: query?.start, end: query?.end }
        : null,
    status: (query?.status as string)?.split(',') as IOrderStatus[],
    deliveryProviderIds: (query?.delivery_providers as string)?.split(
      ',',
    ) as IDeliveryProviderType[],
    paymentProviderIds: (query?.payment_providers as string)?.split(
      ',',
    ) as IPaymentProviderType[],
  });
  if (orderId) return <OrderDetailPage orderId={orderId} />;

  const headerText =
    ordersCount === 1
      ? formatMessage({
          id: 'order_header',
          defaultMessage: '1 Order',
        })
      : formatMessage(
          {
            id: 'order_count_header',
            defaultMessage: '{count} Orders',
          },
          { count: <AnimatedCounter value={ordersCount} /> },
        );

  return (
    <>
      <BreadCrumbs />
      <PageHeader
        title={formatMessage(
          {
            id: 'order_page_title',
            defaultMessage: '{count, plural, one {# Order} other {# Orders}}',
          },
          { count: ordersCount },
        )}
        headerText={headerText}
      />
      <div className="mt-5 inline-block min-w-full overflow-x-auto px-1 pb-5">
        <ListHeader>
          <Toggle
            toggleText={formatMessage({
              id: 'show_carts',
              defaultMessage: 'Show carts',
            })}
            toggleKey="includeCarts"
            active={includeCarts}
          />
        </ListHeader>
        <div className="mt-5 pt-5">
          <OrderFilters
            deliveryProviders={deliveryInterfaces}
            paymentProviders={paymentInterfaces}
          />
        </div>
        <div className="mt-5 pt-5">
          <SearchWithTags
            onSearchChange={setQueryString}
            defaultSearchValue={queryString}
          >
            <InfiniteScroll
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            >
              {loading && orders?.length === 0 ? (
                <Loading />
              ) : (
                <OrderList
                  loading={loading && orders?.length > 0}
                  orders={orders}
                  showUser
                  sortable
                />
              )}
            </InfiniteScroll>
          </SearchWithTags>
        </div>
      </div>
    </>
  );
};

export default Orders;
