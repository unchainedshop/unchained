import assert from 'node:assert';
import { describe, it } from 'node:test';
import { buyerInput, checkoutStatus, recoverable } from './status.ts';

const missing = [recoverable('missing', '$.buyer.email', 'Provide the buyer email')];
const escalations = [buyerInput('payment_required', 'The buyer pays on the merchant checkout')];
const open = {
  placed: false,
  canceled: false,
  expired: false,
  attempt: false,
  escalations: [],
  missing: [],
};

describe('UCP checkout status', () => {
  const cases: [string, Partial<typeof open>, string][] = [
    [
      'a placed order',
      { placed: true, canceled: true, attempt: true, escalations, missing },
      'completed',
    ],
    ['a canceled cart', { canceled: true, attempt: true, escalations }, 'canceled'],
    ['an expired cart', { expired: true, missing }, 'canceled'],
    ['a live payment attempt', { attempt: true, escalations, missing }, 'complete_in_progress'],
    ['a cart without usable payment handler', { escalations, missing }, 'requires_escalation'],
    ['a cart with missing data', { missing }, 'incomplete'],
    ['a complete cart', {}, 'ready_for_complete'],
  ];
  for (const [name, state, status] of cases) {
    it(`is ${status} for ${name}`, () => {
      assert.equal(checkoutStatus({ ...open, ...state }), status);
    });
  }
});
