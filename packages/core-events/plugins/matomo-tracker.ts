/* eslint-disable camelcase */
import fetch from 'isomorphic-unfetch';
import { encode } from 'querystring';
import { Orders } from 'meteor/unchained:core-orders';
import { subscribe } from 'unchained-events';

const parseCurrency = (amount: number): number =>
  parseFloat((amount / 100).toString());
const actionMap = {
  ORDER_ADD_PRODUCT: 'addEcommerceItem',
  ORDER_UPDATE_CART_ITEM: 'addEcommerceItem',
  ORDER_REMOVE_CART_ITEM: 'addEcommerceItem',
  ORDER_CHECKOUT: 'trackEcommerceOrder',
};

export type OrderOption = {
  ec_id?: string;
  _ects?: number;
  uid?: string;
  _id?: string;
  revenue?: number;
  ec_tx?: number;
  ec_dt?: number;
  ec_items?: string;
  idgoal?: number;
};

export interface MatomoOptions {
  transform: (
    eventName: string,
    orderOptions: OrderOption,
    context: any
  ) => OrderOption;
}

const extractOrderParameters = (orderId): OrderOption => {
  const order = (Orders as any).findOrder({ orderId });
  const pricing = order.pricing();
  const orderOptions: OrderOption = {
    idgoal: 0,
    _ects: new Date().getTime(),
    uid: order.userId,
    _id: order.userId,
    revenue: parseCurrency(order.pricing().total().amount),
    ec_tx: parseCurrency(pricing.taxSum()),
    ec_dt: pricing.discountSum(),
    ec_items: JSON.stringify(
      order
        .items()
        .map((item) => [
          `${item.product()?.warehousing?.sku}`,
          item.product()?.getLocalizedTexts()?.title,
          '',
          parseCurrency(item.pricing().unitPrice().amount),
          item.quantity,
        ])
    ),
  };
  if (!order.isCart()) {
    orderOptions.ec_id = order._id;
  }
  return orderOptions;
};

const MatomoTracker = (
  siteId: number,
  siteUrl: string,
  subscribeTo: string,
  options?: MatomoOptions
): void => {
  if (!siteId && typeof siteId !== 'number')
    throw new Error('Matomo siteId is required');
  if (!siteUrl && typeof siteUrl !== 'string')
    throw new Error('Matomo tracker URL is required');
  if (!subscribeTo && typeof subscribeTo !== 'string')
    throw new Error('Event that triggers tracking should be provided');

  subscribe(
    subscribeTo,
    (data: {
      payload: { order: any; orderPosition: any };
      context: any;
    }) => {
      let matomoOptions: OrderOption = {};
      if (data.payload?.order || data.payload?.orderPosition)
        matomoOptions = extractOrderParameters(
          data.payload?.order?._id || data.payload?.orderPosition?.orderId
        );

      matomoOptions = options?.transform
        ? options?.transform(subscribeTo, matomoOptions, data.context) ?? {}
        : matomoOptions;

      fetch(
        `${siteUrl}/matomo.php?idsite=${siteId}&rec=1&action_name=${
          actionMap[subscribeTo]
        }&${encode(matomoOptions)}`
      );
    }
  );
};

export const initMatomo = (
  siteId: number,
  url: string,
  options?: MatomoOptions
): void => {
  MatomoTracker(siteId, url, 'ORDER_CHECKOUT', options);
  MatomoTracker(siteId, url, 'ORDER_UPDATE_CART_ITEM', options);
  MatomoTracker(siteId, url, 'ORDER_ADD_PRODUCT', options);
  MatomoTracker(siteId, url, 'ORDER_REMOVE_CART_ITEM', options);
};

export default MatomoTracker;
