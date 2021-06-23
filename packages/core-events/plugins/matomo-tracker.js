import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { subscribe } from '../director';

const extractOrderParameters = (order) => {
  const orderOptions = {};
  if (order.status === 'CONFIRMED') orderOptions.action = 'trackEcommerceOrder';
  if (order.isCart()) orderOptions.action = 'addEcommerceItem';

  orderOptions.idgoal = 0;
  orderOptions.ec_id = order._id;

  orderOptions.ec_items = JSON.stringify(
    order
      .items()
      .map((item) => [
        `${item.productId} SKU`,
        item.product()?.getLocalizedTexts()?.title,
        ' ',
        parseFloat(item.pricing().unitPrice().amount),
        item.quantity,
      ])
  );
  // eslint-disable-next-line no-underscore-dangle
  orderOptions._ects = new Date().getTime();
  const pricing = order.pricing();
  orderOptions.revenue = parseFloat(order.pricing().total().amount);
  orderOptions.ec_tx = parseFloat(pricing.taxSum());
  orderOptions.ec_dt = pricing.discountSum();

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
      orderOptions = extractOrderParameters(payload.orderPosition.order());

    await fetch(
      `${siteUrl}?idsite=${siteId}&rec=1&action_name=${
        orderOptions.action ?? payload?.path
      }&urlref=${payload?.referrer}&${encode(options)}&${encode(orderOptions)}`
    );
  });
};

export default MatomoTracker;
