import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { subscribe } from '../director';

const extractOrderParameters = (order) => {
  const orderOptions = {};
  orderOptions.idgoal = 0;
  orderOptions.ec_id = order._id;

  orderOptions.ec_items = JSON.stringify(
    order
      .items()
      .map((i) => [
        `${i.productId} SKU`,
        ' ',
        ' ',
        `${i.pricing().unitPrice().amount}`,
        i.quantity,
      ])
  );
  // eslint-disable-next-line no-underscore-dangle
  orderOptions._ects = new Date().getTime();
  const pricing = order.pricing();
  orderOptions.revenue = order.pricing().total().amount;
  orderOptions.ec_tx = pricing.taxSum();
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
    if (payload?.order && payload?.order?.status === 'CONFIRMED')
      orderOptions = extractOrderParameters(payload.order);

    await fetch(
      `${siteUrl}?idsite=${siteId}&rec=1&action_name=${payload?.path}&urlref=${
        payload?.referrer
      }&${encode(options)}&${encode(orderOptions)}`
    );
  });
};

export default MatomoTracker;
