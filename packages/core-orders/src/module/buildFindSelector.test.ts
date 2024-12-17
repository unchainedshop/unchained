import { OrderStatus } from '../db/OrdersCollection.js';
import { buildFindByIdSelector as buildFindByIdSelectorForDelivery } from './configureOrderDeliveriesModule.js';
import { buildFindOrderDiscountByIdSelector } from './configureOrderDiscountsModule.js';
import {
  buildFindOrderPaymentByIdSelector,
  buildFindByContextDataSelector,
} from './configureOrderPaymentsModule.js';
import { buildFindOrderPositionByIdSelector } from './configureOrderPositionsModule.js';
import buildFindSelectorForOrder from './buildFindSelector.js';

describe('OrderPosition', () => {
  describe('buildFindSelector', () => {
    it('Return filter object when passed no argument', () => {
      expect(buildFindSelectorForOrder({})).toEqual({ status: { $ne: null } });
    });

    it('Return filter object when passed no argument includeCarts, queryString, status, userId and (status should take precedence over includeCarts', () => {
      expect(
        buildFindSelectorForOrder({
          includeCarts: false,
          queryString: 'hello world',
          status: [OrderStatus.CONFIRMED],
          userId: 'admin-id',
        }),
      ).toEqual({
        userId: 'admin-id',
        status: {
          $in: ['CONFIRMED'],
        },
        $text: { $search: 'hello world' },
      });
    });

    it('Return filter object when passed no argument includeCarts, queryString, userId ', () => {
      expect(
        buildFindSelectorForOrder({
          includeCarts: true,
          queryString: 'hello world',
          userId: 'admin-id',
        }),
      ).toEqual({
        userId: 'admin-id',

        $text: { $search: 'hello world' },
      });
    });

    it('Return filter object when passed no argument queryString, userId ', () => {
      expect(buildFindSelectorForOrder({ queryString: 'hello world', userId: 'admin-id' })).toEqual({
        userId: 'admin-id',
        $text: { $search: 'hello world' },
        status: { $ne: null },
      });
    });

    it('Return filter object when passed no argument queryString ', () => {
      expect(buildFindSelectorForOrder({ queryString: 'hello world' })).toEqual({
        $text: { $search: 'hello world' },
        status: { $ne: null },
      });
    });
  });
});

describe('OrderDelivery', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      expect(buildFindByIdSelectorForDelivery('order-delivery-id')).toEqual({
        _id: 'order-delivery-id',
      });
    });
  });
});

describe('OrderDiscount', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      expect(buildFindOrderDiscountByIdSelector('order-discount-id')).toEqual({
        _id: 'order-discount-id',
      });
    });
  });
});

describe('OrderPayment', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      expect(buildFindOrderPaymentByIdSelector('order-payment-id')).toEqual({ _id: 'order-payment-id' });
    });
  });

  describe('buildFindByContextDataSelector', () => {
    it('Return correct db context field selector object', () => {
      expect(buildFindByContextDataSelector({ first: 'first value', second: 'second value' })).toEqual({
        'context.first': 'first value',
        'context.second': 'second value',
      });
    });
  });
});

describe('OrderPosition', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      expect(buildFindOrderPositionByIdSelector('order-position-id')).toEqual({
        _id: 'order-position-id',
      });
    });
  });
});
