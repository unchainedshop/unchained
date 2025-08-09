import { OrderStatusType } from '../../modules/configureOrderMcpModule.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  LIST: async (orderModule, params) => {
    const {
      limit = 10,
      offset = 0,
      includeCarts = false,
      queryString,
      status,
      sort,
      paymentProviderTypes = [],
      deliveryProviderTypes = [],
      paymentProviderIds = [],
      deliveryProviderIds = [],
      dateRange,
    } = params;

    const sortOptions =
      sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
      undefined;

    const orders = await orderModule.list({
      limit,
      offset,
      includeCarts,
      queryString,
      status: status as OrderStatusType[],
      sort: sortOptions,
      paymentProviderTypes: paymentProviderTypes as PaymentProviderType[],
      deliveryProviderTypes: deliveryProviderTypes as DeliveryProviderType[],
      paymentProviderIds,
      deliveryProviderIds,
      dateRange,
    });

    return { orders };
  },

  SALES_SUMMARY: async (
    orderModule,
    { from, to, days, paymentProviderIds, deliveryProviderIds, status },
  ) => {
    return await orderModule.salesSummary({
      from,
      to,
      days,
      paymentProviderIds,
      deliveryProviderIds,
      status: status as any,
    });
  },

  MONTHLY_BREAKDOWN: async (
    orderModule,
    { from, to, paymentProviderIds, deliveryProviderIds, status },
  ) => {
    return await orderModule.monthlyBreakdown({
      from,
      to,
      paymentProviderIds,
      deliveryProviderIds,
      status: status as any,
    });
  },

  TOP_CUSTOMERS: async (orderModule, { limit, customerStatus, from, to }) => {
    return await orderModule.topCustomers({
      limit,
      customerStatus,
      from,
      to,
    });
  },

  TOP_PRODUCTS: async (orderModule, { from, to, limit }) => {
    return await orderModule.topProducts({
      from,
      to,
      limit,
    });
  },
};

export default actionHandlers;
