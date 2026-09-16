import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ticketingAdminPlugin } from './admin-plugin.ts';

test('ticketing registers one menu with permission-controlled pages', () => {
  const plugin = ticketingAdminPlugin();
  assert.equal(plugin.navigation?.label, 'Ticketing');
  const gate = plugin.slots.pages!.find(({ path }) => path === '/gate-control')!;
  const events = plugin.slots.entities!.find(({ path }) => path === '/ticketing')!;
  assert.equal(gate.requiredRole, 'scanTicket');
  assert.equal(events.requiredRole, 'manageProducts');
  assert.ok(!gate.publicAccess);
  assert.ok(!plugin.slots.links?.length);

  const extended = ticketingAdminPlugin({
    pages: [{ path: '/reports', label: 'Reports', component: 'ReportsPage' }],
    'dashboard:widgets': [{ component: 'SalesWidget' }],
  });
  assert.deepEqual(
    extended.slots.pages!.map(({ path }) => path),
    ['/gate-control', '/reports'],
  );
  assert.equal(extended.slots.entities!.length, 1);
  assert.equal(extended.slots['dashboard:widgets']!.length, 1);
});
