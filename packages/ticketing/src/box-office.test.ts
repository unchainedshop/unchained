import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roles } from '@unchainedshop/api';
import { withTicketing } from './with-ticketing.ts';
import { canSellAtBoxOffice, withBoxOfficePaymentProviders } from './box-office.ts';
import { BoxOffice } from './payment/box-office/adapter.ts';

const users: Record<string, any> = {
  staff: { _id: 'staff', roles: ['ticketing'] },
  admin: { _id: 'admin', roles: ['admin'] },
  customer: { _id: 'customer', roles: [] },
  guest: { _id: 'guest', roles: ['ticketing'], guest: true },
};
const modules = { users: { findUserById: async (userId: string) => users[userId] ?? null } } as any;

const providers = [
  { _id: 'card', adapterKey: 'shop.unchained.payment.card' },
  { _id: 'box', adapterKey: 'shop.unchained.payment.box-office' },
  { _id: 'invoice', adapterKey: 'shop.unchained.invoice' },
] as any[];

const configure = () => roles.configureRoles((withTicketing({}) as any).rolesOptions);

test('the box office permission is derived by the roles engine', async () => {
  configure();
  assert.equal(await canSellAtBoxOffice(users.staff, modules), true);
  assert.equal(await canSellAtBoxOffice(users.admin, modules), true);
  assert.equal(await canSellAtBoxOffice(users.customer, modules), false);
  assert.equal(await canSellAtBoxOffice(users.guest, modules), false);
  assert.equal(await canSellAtBoxOffice(null, modules), false);
});

test('box office providers come first for staff and never show for customers', async () => {
  configure();
  const filter = withBoxOfficePaymentProviders();
  const ids = async (userId: string) =>
    (await filter({ providers, order: { userId } as any }, { modules })).map(({ _id }) => _id);
  assert.deepEqual(await ids('staff'), ['box', 'card', 'invoice']);
  assert.deepEqual(await ids('customer'), ['card', 'invoice']);
});

test('the project filter decides on the result, and wrapping twice changes nothing', async () => {
  configure();
  const projectFilter = async ({ providers: allowed }: any) =>
    allowed.filter(({ _id }: any) => _id !== 'card');
  const filter = withBoxOfficePaymentProviders(projectFilter);
  assert.equal(withBoxOfficePaymentProviders(filter), filter);
  const result = await filter({ providers, order: { userId: 'staff' } as any }, { modules });
  assert.deepEqual(
    result.map(({ _id }) => _id),
    ['box', 'invoice'],
  );
  const options = withTicketing({
    options: { payment: { filterSupportedProviders: projectFilter } },
  }) as any;
  assert.equal(
    (withTicketing(options) as any).options.payment.filterSupportedProviders,
    options.options.payment.filterSupportedProviders,
  );
});

test('the box office adapter charges only for staff', async () => {
  configure();
  const charge = (userId: string) =>
    BoxOffice.actions([], { userId, modules, paymentProvider: {} as any } as any).charge();
  assert.ok(await charge('staff'));
  await assert.rejects(charge('customer'), { cause: 'BOX_OFFICE_NOT_ALLOWED' });
});
