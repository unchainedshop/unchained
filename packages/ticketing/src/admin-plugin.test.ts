import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ticketingAdminPlugin } from './admin-plugin.ts';
import { getPluginPageRedirect } from '../../../admin-ui/src/modules/Auth/permissionConfig.ts';

test('ticketing has one menu with authenticated, permission-controlled pages', () => {
  const plugin = ticketingAdminPlugin();
  assert.equal(plugin.navigation?.label, 'Ticketing');
  const gate = plugin.slots.pages!.find(({ path }) => path === '/gate-control')!;
  const events = plugin.slots.entities!.find(({ path }) => path === '/ticketing')!;
  assert.equal(gate.requiredRole, 'scanTicket');
  assert.equal(events.requiredRole, 'manageProducts');
  assert.ok(!gate.publicAccess);
  assert.deepEqual(plugin.slots.links, []);
  for (const viewer of [undefined, { _id: 'guest', isGuest: true }]) {
    assert.equal(getPluginPageRedirect(viewer, gate), '/log-in');
  }
  const scanner = { _id: 'scanner', allowedActions: ['scanTicket'] };
  assert.equal(getPluginPageRedirect(scanner, gate), null);
  assert.equal(getPluginPageRedirect(scanner, events), '/403');
  const customer = { _id: 'customer', allowedActions: ['viewProduct'] };
  assert.equal(getPluginPageRedirect(customer, gate), '/403');
  const admin = { _id: 'admin', roles: ['admin'] };
  assert.equal(getPluginPageRedirect(admin, gate), null);
  assert.equal(getPluginPageRedirect(admin, events), null);
});
