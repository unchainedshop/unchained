import { describe, it } from 'node:test';
import assert from 'node:assert';
import { OrderStatus } from '../db/OrdersCollection.ts';
import { buildFindByIdSelector as buildFindByIdSelectorForDelivery } from './configureOrderDeliveriesModule.ts';
import { buildFindOrderDiscountByIdSelector } from './configureOrderDiscountsModule.ts';
import { buildFindOrderPaymentByIdSelector } from './configureOrderPaymentsModule.ts';
import { buildFindOrderPositionByIdSelector } from './configureOrderPositionsModule.ts';
import buildFindSelectorForOrder from './buildFindSelector.ts';

describe('OrderPosition', () => {
  describe('buildFindSelector', () => {
    it('Return filter object when passed no argument', () => {
      assert.deepStrictEqual(buildFindSelectorForOrder({}), { status: { $ne: null } });
    });

    it('Return filter object when passed includeCarts, queryString, status, userId and (status should take precedence over includeCarts)', () => {
      assert.deepStrictEqual(
        buildFindSelectorForOrder({
          includeCarts: false,
          queryString: 'hello world',
          status: [OrderStatus.CONFIRMED],
          userId: 'admin-id',
        }),
        {
          userId: 'admin-id',
          status: {
            $in: ['CONFIRMED'],
          },
          $text: { $search: 'hello world' },
        },
      );
    });

    it('Return filter object when passed includeCarts, queryString, userId', () => {
      assert.deepStrictEqual(
        buildFindSelectorForOrder({
          includeCarts: true,
          queryString: 'hello world',
          userId: 'admin-id',
        }),
        {
          userId: 'admin-id',
          $text: { $search: 'hello world' },
        },
      );
    });

    it('Return filter object when passed queryString, userId', () => {
      assert.deepStrictEqual(
        buildFindSelectorForOrder({ queryString: 'hello world', userId: 'admin-id' }),
        {
          userId: 'admin-id',
          $text: { $search: 'hello world' },
          status: { $ne: null },
        },
      );
    });

    it('Return filter object when passed queryString', () => {
      assert.deepStrictEqual(buildFindSelectorForOrder({ queryString: 'hello world' }), {
        $text: { $search: 'hello world' },
        status: { $ne: null },
      });
    });
  });
});

describe('OrderDelivery', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      assert.deepStrictEqual(buildFindByIdSelectorForDelivery('order-delivery-id'), {
        _id: 'order-delivery-id',
      });
    });
  });
});

describe('OrderDiscount', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      assert.deepStrictEqual(buildFindOrderDiscountByIdSelector('order-discount-id'), {
        _id: 'order-discount-id',
      });
    });
  });
});

describe('OrderPayment', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      assert.deepStrictEqual(buildFindOrderPaymentByIdSelector('order-payment-id'), {
        _id: 'order-payment-id',
      });
    });
  });
});

describe('OrderPosition', () => {
  describe('buildFindByIdSelector', () => {
    it('Return correct db _id selector', () => {
      assert.deepStrictEqual(buildFindOrderPositionByIdSelector('order-position-id'), {
        _id: 'order-position-id',
      });
    });
  });
});
