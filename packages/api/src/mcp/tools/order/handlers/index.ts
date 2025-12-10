import listOrders from './listOrders.ts';
import getSalesSummary from './getSalesSummary.ts';
import getMonthlyBreakdown from './getMonthlyBreakdown.ts';
import getTopCustomers from './getTopCustomers.ts';
import getTopProducts from './getTopProducts.ts';
import getUserCart from './getUserCart.ts';
import getOrder from './getOrder.ts';
import payOrder from './payOrder.ts';
import deliverOrder from './deliverOrder.ts';
import confirmOrder from './confirmOrder.ts';
import rejectOrder from './rejectOrder.ts';

export default {
  LIST: listOrders,
  SALES_SUMMARY: getSalesSummary,
  MONTHLY_BREAKDOWN: getMonthlyBreakdown,
  TOP_CUSTOMERS: getTopCustomers,
  TOP_PRODUCTS: getTopProducts,
  GET_CART: getUserCart,
  GET: getOrder,
  PAY_ORDER: payOrder,
  DELIVER_ORDER: deliverOrder,
  CONFIRM_ORDER: confirmOrder,
  REJECT_ORDER: rejectOrder,
};
