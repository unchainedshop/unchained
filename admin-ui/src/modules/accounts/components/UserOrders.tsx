import React from 'react';
import { useRouter } from 'next/router';
import SearchField from '../../common/components/SearchField';
import OrderList from '../../order/components/OrderList';

import useUserOrders from '../../order/hooks/useUserOrders';
import { convertSortFieldsToQueryFormat } from '../../common/utils/utils';
import Toggle from '../../common/components/Toggle';
import { useIntl } from 'react-intl';

const UserOrders = ({ _id: userId }) => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const { queryString, ...rest } = query;
  const sort = query?.sort;
  const sortKeys = convertSortFieldsToQueryFormat(sort);
  const includeCarts = query?.includeCarts === 'true';

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

  const { orders, loading } = useUserOrders({
    userId,
    queryString: queryString as string,
    sort: sortKeys,
    includeCarts,
  });

  return (
    <div className="space-y-4 mt-4">
      <Toggle
        toggleText={formatMessage({
          id: 'show_carts',
          defaultMessage: 'Show carts',
        })}
        toggleKey="includeCarts"
        active={includeCarts}
      />
      <SearchField defaultValue={queryString} onInputChange={setQueryString} />
      <OrderList loading={loading} orders={orders} showUser={false} sortable />
    </div>
  );
};

export default UserOrders;
