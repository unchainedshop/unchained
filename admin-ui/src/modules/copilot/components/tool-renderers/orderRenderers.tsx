import CopilotOrderList, {
  CopilotOrderListItem,
} from '../order/CopilotOrderList';
import SalesSummeryReport from '../order/SalesSummaryReport';
import TopCustomerList from '../order/TopCustomerList';
import TopSellingProductList from '../order/TopSellingProductList';
import {
  createActionMappings,
  createRenderer,
  mergeMappings,
} from './shared/createRenderer';

const renderSalesSummary = (data: any) =>
  data ? <SalesSummeryReport {...data} /> : null;

const renderTopSellingProducts = (data: any) =>
  data ? <TopSellingProductList {...data} /> : null;

const renderTopCustomers = (data: any) =>
  data ? <TopCustomerList {...data} /> : null;

const MULTIPLE_ORDERS_ACTIONS = ['LIST'];
const ORDER_ITEM_ACTIONS = [
  'GET',
  'GET_CART',
  'PAY_ORDER',
  'DELIVER_ORDER',
  'CONFIRM_ORDER',
  'REJECT_ORDER',
];
const toolsMap = mergeMappings(
  {
    TOP_CUSTOMERS: renderTopCustomers,
    MONTHLY_BREAKDOWN: renderSalesSummary,
    SALES_SUMMARY: renderSalesSummary,
    TOP_PRODUCTS: renderTopSellingProducts,
  },
  createActionMappings(MULTIPLE_ORDERS_ACTIONS, (data) => (
    <CopilotOrderList {...(data as any)} />
  )),
  createActionMappings(ORDER_ITEM_ACTIONS, (data) => (
    <CopilotOrderListItem {...(data as any)} />
  )),
);

export const renderOrderToolResponses = createRenderer({
  toolsMap,
});
