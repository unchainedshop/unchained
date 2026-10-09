import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrderStatus, type Order } from '@unchainedshop/core-orders';
import { acpOrderStatus } from './order.ts';

describe('ACP order projection', () => {
  it('maps fulfilled Unchained orders to the ACP completed status', () => {
    assert.equal(acpOrderStatus({ status: OrderStatus.FULFILLED, context: {} } as Order), 'completed');
  });

  it('gives an ACP cancellation marker precedence over the order lifecycle', () => {
    assert.equal(
      acpOrderStatus({
        status: OrderStatus.CONFIRMED,
        context: { acp: { canceled: true } },
      } as Order),
      'canceled',
    );
  });
});
