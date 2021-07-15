import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { Orders } from 'meteor/unchained:core-orders';
import { subscribe } from 'meteor/unchained:core-events';

const parseCurrency = (amount) => parseFloat(amount / 100);
const actionMap = {
  ORDER_ADD_PRODUCT: 'addEcommerceItem',
  ORDER_UPDATE_CART_ITEM: 'addEcommerceItem',
  ORDER_REMOVE_CART_ITEM: 'addEcommerceItem',
  ORDER_CHECKOUT: 'trackEcommerceOrder',
};

const extractOrderParameters = (currentOrder) => {
  const orderOptions = {};
  const order = Orders.findOrder({ orderId: currentOrder._id });

  if (!order.isCart()) {
    orderOptions.ec_id = order._id;
  }
  // eslint-disable-next-line no-underscore-dangle
  orderOptions._ects = new Date().getTime();
  orderOptions.uid = order.userId;
  orderOptions._id = order.userId;
  const pricing = order.pricing();
  orderOptions.revenue = parseCurrency(order.pricing().total().amount);
  orderOptions.ec_tx = parseCurrency(pricing.taxSum());
  orderOptions.ec_dt = pricing.discountSum();

  orderOptions.ec_items = JSON.stringify(
    order
      .items()
      .map((item) => [
        `${item.product()?.warehousing?.sku}`,
        item.product()?.getLocalizedTexts()?.title,
        '',
        parseCurrency(item.pricing().unitPrice().amount),
        item.quantity,
      ])
  );

  orderOptions.idgoal = 0;
  return orderOptions;
};

const MatomoTracker = (siteId, siteUrl, subscribeTo, options = {}) => {
  if (!siteId && (typeof siteId !== 'number' || siteId !== 'string'))
    throw new Error('Matomo siteId is required');
  if (!siteUrl && typeof siteUrl !== 'string')
    throw new Error('Matomo tracker URL is required');
  if (!subscribeTo && typeof subscribeTo !== 'string')
    throw new Error('Event that triggers tracking should be provided');

  const extraOptions = Object.keys(options || {}).length
    ? `&${encode(options)}`
    : '';

  subscribe(subscribeTo, async ({ payload }) => {
    let orderOptions = {};
    if (
      payload?.order ||
      payload?.payload?.order ||
      payload?.orderPosition ||
      payload?.payload?.orderPosition
    )
      orderOptions = extractOrderParameters(
        payload?.order ||
          payload?.payload?.order ||
          payload?.orderPosition?.order() ||
          payload?.payload?.orderPosition?.order()
      );
    await fetch(
      `${siteUrl}/matomo.php?idsite=${siteId}&rec=1&action_name=${
        actionMap[subscribeTo]
      }&${encode(orderOptions)}${extraOptions}`
    );
  });
};

export default MatomoTracker;
