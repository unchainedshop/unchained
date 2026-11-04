import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { ordersSettings } from '@unchainedshop/core-orders';
import { OrderDiscountDirector } from '../directors/OrderDiscountDirector.ts';
import { PaymentDirector } from '../directors/PaymentDirector.ts';
import { createServiceError } from '../errors.ts';
import type { Modules } from '../modules.ts';
import { checkoutOrderService } from './checkoutOrder.ts';

const modulesFor = (order: unknown, events: string[]) =>
  ({
    orders: {
      acquireLock: mock.fn(async () => {
        events.push('lock');
        return { [Symbol.asyncDispose]: async () => events.push('release') };
      }),
      findOrder: async () => {
        events.push('read');
        return order;
      },
    },
  }) as unknown as Modules;

const cart = {
  _id: 'order-id',
  status: null,
  userId: 'user-id',
  contact: { emailAddress: 'hello@unchained.local' },
  billingAddress: { firstName: 'Ada', lastName: 'Lovelace' },
  deliveryId: 'delivery-id',
  paymentId: 'payment-id',
};

// A cart that passes validateOrder, with no quotations and the given discounts
const checkoutModulesFor = (
  events: string[],
  discounts: { _id: string; discountKey: string }[] = [],
) => {
  const modules = modulesFor(cart, events) as any;
  Object.assign(modules.orders, {
    deliveries: { findDelivery: async () => ({ _id: 'delivery-id' }) },
    payments: { findOrderPayment: async () => ({ _id: 'payment-id' }) },
    positions: { findOrderPositions: async () => [{ productId: 'product-id', configuration: null }] },
    discounts: { findOrderDiscounts: async () => discounts },
  });
  modules.products = { findProduct: async () => ({ _id: 'product-id' }), isActive: () => true };
  return modules as Modules;
};

const reservationFor = (events: string[], { failRelease = false } = {}) =>
  mock.fn(async () => {
    events.push('reserve');
    return {
      release: async () => {
        events.push('reservation released');
        if (failRelease) throw new Error('database unavailable');
      },
    };
  });

describe('checkoutOrderService', () => {
  // ordersSettings is shared with a platform running in the same process (npm test)
  let configuredReserveForCheckout: typeof ordersSettings.reserveForCheckout;
  beforeEach(() => {
    configuredReserveForCheckout = ordersSettings.reserveForCheckout;
  });
  afterEach(() => {
    ordersSettings.reserveForCheckout = configuredReserveForCheckout;
  });

  it('reads the order under the lock and returns orders that left the cart', async () => {
    const events: string[] = [];
    const confirmedOrder = { _id: 'order-id', status: 'CONFIRMED' };
    const modules = modulesFor(confirmedOrder, events);

    assert.equal(await checkoutOrderService.call(modules, 'order-id', {}), confirmedOrder);
    assert.equal(await checkoutOrderService.call(modulesFor(null, []), 'missing-id', {}), null);
    assert.deepEqual(events, ['lock', 'read', 'release']);
    assert.deepEqual((modules.orders.acquireLock as any).mock.calls[0].arguments, [
      'order-id',
      'checkout',
    ]);
  });

  it('releases the lock when the cart cannot be checked out', async () => {
    const events: string[] = [];
    await assert.rejects(
      checkoutOrderService.call(modulesFor({ _id: 'order-id', status: null }, events), 'order-id', {}),
      { name: 'ContactMissingError' },
    );
    assert.deepEqual(events, ['lock', 'read', 'release']);
  });

  it('reserves for the checkout of a valid cart before payment and releases a failed one', async (t) => {
    const events: string[] = [];
    const reserveForCheckout = reservationFor(events);
    ordersSettings.reserveForCheckout = reserveForCheckout as typeof ordersSettings.reserveForCheckout;
    t.mock.method(PaymentDirector, 'chargeOrderPayment', async () => {
      events.push('charge');
      throw new Error('PAYMENT_DECLINED');
    });
    const modules = checkoutModulesFor(events);

    await assert.rejects(checkoutOrderService.call(modules, 'order-id', {}), /PAYMENT_DECLINED/);
    assert.deepEqual(events, ['lock', 'read', 'reserve', 'charge', 'reservation released', 'release']);
    assert.deepEqual(reserveForCheckout.mock.calls[0].arguments, [cart, { modules }]);
  });

  it('does not reserve for a cart that fails validation', async () => {
    const events: string[] = [];
    const reserveForCheckout = reservationFor(events);
    ordersSettings.reserveForCheckout = reserveForCheckout as typeof ordersSettings.reserveForCheckout;

    await assert.rejects(
      checkoutOrderService.call(modulesFor({ _id: 'order-id', status: null }, events), 'order-id', {}),
      { name: 'ContactMissingError' },
    );
    assert.equal(reserveForCheckout.mock.callCount(), 0);
    assert.deepEqual(events, ['lock', 'read', 'release']);
  });

  it('aborts the checkout when the reservation throws and releases the reservations made', async (t) => {
    const events: string[] = [];
    t.mock.method(OrderDiscountDirector, 'getAdapter', () => ({
      actions: async () => ({
        reserveForCheckout: async () => {
          events.push('discount reserved');
          return { release: async () => events.push('discount released') };
        },
      }),
    }));
    ordersSettings.reserveForCheckout = async () => {
      events.push('reserve');
      throw createServiceError('SupplyExhaustedError', 'Sold out');
    };
    const charge = t.mock.method(PaymentDirector, 'chargeOrderPayment', async () => true);

    await assert.rejects(
      checkoutOrderService.call(
        checkoutModulesFor(events, [{ _id: 'discount-id', discountKey: 'credit' }]),
        'order-id',
        {},
      ),
      { name: 'SupplyExhaustedError', message: 'Sold out' },
    );
    assert.equal(charge.mock.callCount(), 0);
    assert.deepEqual(events, [
      'lock',
      'read',
      'discount reserved',
      'reserve',
      'discount released',
      'release',
    ]);
  });

  it('keeps the checkout error when releasing the reservation fails', async (t) => {
    const events: string[] = [];
    ordersSettings.reserveForCheckout = reservationFor(events, {
      failRelease: true,
    }) as typeof ordersSettings.reserveForCheckout;
    t.mock.method(PaymentDirector, 'chargeOrderPayment', async () => {
      throw new Error('PAYMENT_DECLINED');
    });

    await assert.rejects(
      checkoutOrderService.call(checkoutModulesFor(events), 'order-id', {}),
      /PAYMENT_DECLINED/,
    );
    assert.deepEqual(events, ['lock', 'read', 'reserve', 'reservation released', 'release']);
  });

  it('accepts a reservation hook that returns nothing', async (t) => {
    const events: string[] = [];
    ordersSettings.reserveForCheckout = async () => {
      events.push('reserve');
    };
    t.mock.method(PaymentDirector, 'chargeOrderPayment', async () => {
      throw new Error('PAYMENT_DECLINED');
    });

    await assert.rejects(
      checkoutOrderService.call(checkoutModulesFor(events), 'order-id', {}),
      /PAYMENT_DECLINED/,
    );
    assert.deepEqual(events, ['lock', 'read', 'reserve', 'release']);
  });
});
