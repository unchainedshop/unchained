import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import { configureTicketingRoles, ticketingActions } from '../../roles.ts';
import attendee from './attendee.ts';

registerEvents(['ACL_DENIED']);
const permissions = roles.configureRoles({
  additionalActions: ticketingActions,
  additionalRoles: { ticketing: configureTicketingRoles },
});

const event = { _id: 'event', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE' };

const resolve = (holder: any, viewerRoles = ['ticketing'], token: any = { productId: event._id }) => {
  const loadedUsers: string[] = [];
  const context: any = {
    userId: 'viewer',
    user: { _id: 'viewer', roles: viewerRoles },
    roles: permissions,
    loaders: {
      productLoader: { load: async () => event },
      userLoader: {
        load: async ({ userId }: { userId: string }) => {
          loadedUsers.push(userId);
          return holder;
        },
      },
    },
    modules: { users: { primaryEmail: (user: any) => user.emails?.[0] } },
  };
  return {
    result: attendee({ userId: holder?._id, ...token }, undefined as never, context),
    loadedUsers,
  };
};

test('attendee names the holder from their profile, the ticket purchase or their username', async () => {
  const guest = {
    _id: 'guest',
    guest: true,
    emails: [{ address: 'guest@example.com' }],
    lastBillingAddress: { firstName: 'Jane', lastName: 'Doe' },
    lastContact: { telNumber: '+41790000000' },
  };
  assert.deepEqual(await resolve(guest).result, {
    name: 'Jane Doe',
    email: 'guest@example.com',
    phone: '+41790000000',
  });
  const member = {
    _id: 'member',
    username: 'jdoe',
    profile: { displayName: 'Jane', phoneMobile: '+41780000000' },
    emails: [{ address: 'account@example.com' }],
    lastContact: { emailAddress: 'checkout@example.com' },
  };
  assert.deepEqual(await resolve(member).result, {
    name: 'Jane',
    email: 'checkout@example.com',
    phone: '+41780000000',
  });
  assert.equal((await resolve({ _id: 'handle', username: 'jdoe' }).result)?.name, 'jdoe');
  assert.equal(
    await resolve(null, ['ticketing'], { productId: event._id, userId: undefined }).result,
    null,
  );
});

test('attendee details stay hidden from viewers without ticketing access', async () => {
  const { result, loadedUsers } = resolve({ _id: 'buyer' }, []);
  await assert.rejects(result, /permission/i);
  assert.deepEqual(loadedUsers, []);
});
