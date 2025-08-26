import listOrders from './listOrders.js';
import getSalesSummary from './getSalesSummary.js';
import getMonthlyBreakdown from './getMonthlyBreakdown.js';
import getTopCustomers from './getTopCustomers.js';
import getTopProducts from './getTopProducts.js';
import getUserCart from './getUserCart.js';
import getOrder from './getOrder.js';

export default {
  LIST: listOrders,
  SALES_SUMMARY: getSalesSummary,
  MONTHLY_BREAKDOWN: getMonthlyBreakdown,
  TOP_CUSTOMERS: getTopCustomers,
  TOP_PRODUCTS: getTopProducts,
  GET_CART: getUserCart,
  GET: getOrder,
};
