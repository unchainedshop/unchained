import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roles } from '@unchainedshop/api';
import { registerEvents } from '@unchainedshop/events';
import { withTicketing } from './with-ticketing.ts';
import { configureTicketingRoles, createTicketingRoles } from './api/index.ts';

const ownEvent = { _id: 'own', type: 'TOKENIZED_PRODUCT', status: 'ACTIVE', tags: ['organizer:a'] };
const foreignEvent = {
  _id: 'foreign',
  type: 'TOKENIZED_PRODUCT',
  status: 'ACTIVE',
  tags: ['organizer:b'],
};

test('withTicketing wires the organizer scope into the ticketing role', async () => {
  registerEvents(['ACL_DENIED']);
  const canAccessEvent = (event: any) => event.tags.includes('organizer:a');
  const options = withTicketing({}, { canAccessEvent }) as any;
  const permissions = roles.configureRoles(options.rolesOptions);
  const staff = {
    userId: 'gate',
    user: { _id: 'gate', roles: ['ticketing'] },
    roles: permissions,
  } as any;
  assert.equal(await permissions.userHasPermission(staff, 'viewTokens', [ownEvent, {}]), true);
  assert.equal(await permissions.userHasPermission(staff, 'viewTokens', [foreignEvent, {}]), false);

  // Applying it again with the same scope keeps the role.
  const twice = withTicketing(options, { canAccessEvent }) as any;
  assert.equal(
    twice.rolesOptions.additionalRoles.ticketing,
    options.rolesOptions.additionalRoles.ticketing,
  );

  const unscoped = withTicketing({}) as any;
  assert.equal(unscoped.rolesOptions.additionalRoles.ticketing, configureTicketingRoles);
});

test('withTicketing refuses a scope it cannot apply instead of ignoring it', () => {
  const canAccessEvent = () => true;
  for (const ticketing of [
    () => undefined,
    configureTicketingRoles,
    createTicketingRoles({ canAccessEvent: () => false }),
  ]) {
    assert.throws(
      () => withTicketing({ rolesOptions: { additionalRoles: { ticketing } } }, { canAccessEvent }),
      (error: any) => error.cause === 'TICKETING_SCOPE_CONFLICT',
    );
  }
  // A project ticketing role built with the same scope is fine.
  const own = createTicketingRoles({ canAccessEvent });
  const options = withTicketing(
    { rolesOptions: { additionalRoles: { ticketing: own } } },
    { canAccessEvent },
  ) as any;
  assert.equal(options.rolesOptions.additionalRoles.ticketing, own);
});
