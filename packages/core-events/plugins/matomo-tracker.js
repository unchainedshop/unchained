import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { OrderStatus, Orders } from 'meteor/unchained:core-orders';
import crypto from 'crypto';
import { subscribe } from '../director';

const parseCurrency = (amount) => parseFloat(amount / 100);
const actionMap = {
  ORDER_ADD_PRODUCT: 'addEcommerceItem',
  ORDER_UPDATE_CART_ITEM: 'addEcommerceItem',
  ORDER_REMOVE_CART_ITEM: 'removeEcommerceItem',
  OrDER_CHECKOUT: 'trackEcommerceOrder',
  PAGE_VIEW: 'trackPageView',
};

const extractPageInformation = ({ path, referrer, context }) => {
  const pageOptions = {};
  pageOptions.url = context.headers.origin + path;
  pageOptions.urlref = referrer || context.headers.referrer;

  return pageOptions;
};

const extractOrderParameters = (currentEvent, currentOrder) => {
  const orderOptions = {};
  const order = Orders.findOrder({ orderId: currentOrder._id });
  orderOptions.isCart = order.isCart();

  if (currentEvent === 'ORDER_REMOVE_CART_ITEM') {
    orderOptions.ec_items = JSON.stringify(
      order.items().map((item) => [item.product()?.warehousing?.sku])
    );
  } else {
    if (order.status === OrderStatus.CONFIRMED) {
      orderOptions.ec_id = order._id;
    }
    console.log(
      crypto
        .createHash('sha256')
        .update(order.user()._id)
        .digest('hex')
        .substr(0, 16)
    );
    // eslint-disable-next-line no-underscore-dangle
    orderOptions._ects = new Date().getTime();
    orderOptions.uid = order.user().username;
    orderOptions._id = order.user().userId;
    orderOptions.cid = crypto
      .createHash('sha256')
      .update(order.user()._id)
      .digest('hex')
      .substr(0, 16);
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
  }
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
    if (payload?.order || payload?.payload?.order)
      orderOptions = extractOrderParameters(
        subscribeTo,
        payload?.order || payload?.payload?.order
      );
    else if (payload?.orderPosition || payload?.payload?.orderPosition)
      orderOptions = extractOrderParameters(
        subscribeTo,
        payload?.orderPosition?.order() ||
          payload?.payload?.orderPosition?.order()
      );
    else if (subscribeTo === 'PAGE_VIEW') {
      orderOptions = extractPageInformation(payload);
    }
    await fetch(
      `${siteUrl}?idsite=${siteId}&rec=1&action_name=${
        actionMap[subscribeTo]
      }&${encode(orderOptions)}${extraOptions}`
    );
    if (
      actionMap[subscribeTo] !== 'trackEcommerceOrder' &&
      actionMap[subscribeTo] !== 'trackPageView'
    ) {
      await fetch(
        `${siteUrl}?idsite=${siteId}&rec=1&action_name=trackEcommerceCartUpdate&ec_st=${orderOptions?.revenue}${extraOptions}`
      );
    }
  });
};

export default MatomoTracker;
