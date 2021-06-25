import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { OrderStatus, Orders } from 'meteor/unchained:core-orders';
import { subscribe } from '../director';

const parseCurrency = (amount) =>
  parseFloat(parseFloat(amount / 100).toFixed(2));

const extractOrderParameters = (currentOrder) => {
  const orderOptions = {};
  const order = Orders.findOrder({ orderId: currentOrder._id });

  if (order.status === OrderStatus.CONFIRMED) {
    orderOptions.action = 'trackEcommerceOrder';
  }
  if (order.isCart()) {
    orderOptions.action = 'addEcommerceItem';
  }
  orderOptions.isCart = order.isCart();
  // eslint-disable-next-line no-underscore-dangle
  orderOptions._ects = new Date().getTime();
  orderOptions.uid = order.userId;
  const pricing = order.pricing();
  orderOptions.revenue = parseCurrency(order.pricing().total().amount);
  orderOptions.ec_tx = parseCurrency(pricing.taxSum());
  orderOptions.ec_dt = pricing.discountSum();

  orderOptions.ec_id = order._id;

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

  return orderOptions;
};

const MatomoTracker = (siteId, siteUrl, subscribeTo, options = {}) => {
  if (!siteId && (typeof siteId !== 'number' || siteId !== 'string'))
    throw new Error('Matomo siteId is required');
  if (!siteUrl && typeof siteUrl !== 'string')
    throw new Error('Matomo tracker URL is required');
  if (!subscribeTo && typeof subscribeTo !== 'string')
    throw new Error('Event that triggers tracking should be provided');

  subscribe(subscribeTo, async ({ payload }) => {
    let orderOptions = {};
    if (payload?.order) orderOptions = extractOrderParameters(payload.order);
    else if (payload?.orderPosition)
      orderOptions = extractOrderParameters(payload.orderPosition?.order());

    const { isCart, action } = orderOptions;
    delete orderOptions.isCart;
    delete orderOptions.action;
    await fetch(
      `${siteUrl}?idsite=${siteId}&rec=1&action_name=${
        action ?? payload?.path
      }&${encode(orderOptions)}`
    );
    if (orderOptions && isCart) {
      await fetch(
        `${siteUrl}?idsite=${siteId}&rec=1&action_name=trackEcommerceCartUpdate&ec_st=${orderOptions?.revenue}`
      );
    }
  });
};

export default MatomoTracker;
