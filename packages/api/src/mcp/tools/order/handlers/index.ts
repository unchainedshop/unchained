import listOrders from './listOrders.js';
import getSalesSummary from './getSalesSummary.js';
import getMonthlyBreakdown from './getMonthlyBreakdown.js';
import getTopCustomers from './getTopCustomers.js';
import getTopProducts from './getTopProducts.js';
import getUserCart from './getUserCart.js';
import getOrder from './getOrder.js';
import payOrder from './payOrder.js';
import deliverOrder from './deliverOrder.js';
import confirmOrder from './confirmOrder.js';
import rejectOrder from './rejectOrder.js';

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
