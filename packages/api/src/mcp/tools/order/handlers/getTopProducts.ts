import type { Context } from '../../../../context.ts';
import { OrderStatus } from '@unchainedshop/core-orders';
import { resolveDateRange } from '../../../utils/orderFilters.ts';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getTopProducts(context: Context, params: Params<'TOP_PRODUCTS'>) {
  const { modules } = context;
  const { from, to, limit = 10 } = params;

  const { startDate, endDate } = resolveDateRange(from, to);

  const orders = await modules.orders.findOrders(
    {
      status: [OrderStatus.CONFIRMED, OrderStatus.FULFILLED],
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    },
    { fields: ['_id'] },
  );
  const orderIds = orders.map(({ _id }) => _id);

  const topProducts = await modules.orders.positions.getTopProducts(orderIds, { limit });

  const normalizedTopSellingProducts = await Promise.all(
    topProducts.map(async (p) => {
      const product = await getNormalizedProductDetails(p.productId, context);
      return {
        productId: p.productId?.toString?.() ?? null,
        product,
        totalSold: p.totalSold,
        totalRevenue: p.totalRevenue,
      };
    }),
  );

  return {
    products: normalizedTopSellingProducts,
    dateRange: {
      start: from ? new Date(from).toISOString() : null,
      end: to ? new Date(to).toISOString() : null,
    },
  };
}
