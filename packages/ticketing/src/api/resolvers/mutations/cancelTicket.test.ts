import { test } from 'node:test';
import assert from 'node:assert/strict';
import cancelTicket from './cancelTicket.ts';

const token = { _id: 'ticket', productId: 'event' };

function createContext(cancelTicketWithDiscount: (tokenId: string, options: any) => Promise<any>) {
  return {
    userId: 'staff',
    countryCode: 'CH',
    currencyCode: 'CHF',
    modules: {
      warehousing: { findToken: async () => token },
      passes: { cancelTicket: async () => null },
    },
    services: { ticketing: { cancelTicketWithDiscount } },
  } as any;
}

test('cancelTicket refuses a ticket that is redeemed while the cancellation runs', async () => {
  const requests: any[] = [];
  const context = createContext(async (tokenId, options) => {
    requests.push([tokenId, options]);
    throw new Error(`Ticket ${tokenId} has already been redeemed`, {
      cause: 'TICKET_ALREADY_REDEEMED',
    });
  });
  await assert.rejects(
    cancelTicket(undefined as never, { tokenId: 'ticket', generateDiscount: true }, context),
    (error: any) => {
      assert.equal(error.extensions?.code, 'TokenAlreadyRedeemedError');
      assert.equal(error.extensions?.tokenId, 'ticket');
      return true;
    },
  );
  assert.deepEqual(requests, [
    ['ticket', { generateDiscount: true, countryCode: 'CH', currencyCode: 'CHF', refuseRedeemed: true }],
  ]);

  const failure = new Error('issuance failed');
  await assert.rejects(
    cancelTicket(
      undefined as never,
      { tokenId: 'ticket' },
      createContext(async () => {
        throw failure;
      }),
    ),
    (error) => error === failure,
  );
});
