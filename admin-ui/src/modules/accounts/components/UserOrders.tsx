import React from 'react';
import { useRouter } from 'next/router';
import SearchField from '../../common/components/SearchField';
import OrderList from '../../order/components/OrderList';

import useUserOrders from '../../order/hooks/useUserOrders';
import { convertSortFieldsToQueryFormat } from '../../common/utils/utils';

const UserOrders = ({ _id: userId }) => {
  const { query, push } = useRouter();
  const { queryString, ...rest } = query;
  const sort = query?.sort;
  const sortKeys = convertSortFieldsToQueryFormat(sort);

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
  });

  return (
    <div className="space-y-4 mt-4">
      <SearchField defaultValue={queryString} onInputChange={setQueryString} />
      <OrderList loading={loading} orders={orders} showUser={false} sortable />
    </div>
  );
};

export default UserOrders;
