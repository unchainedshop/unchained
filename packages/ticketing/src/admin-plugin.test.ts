import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ticketingAdminPlugin, ticketingNavigation } from './admin-plugin.ts';

test('ticketing registers one menu with permission-controlled pages', () => {
  const plugin = ticketingAdminPlugin();
  assert.equal(plugin.navigation, ticketingNavigation);
  const roleOf = (path: string) =>
    [...plugin.slots.entities!, ...plugin.slots.pages!].find((slot) => slot.path === path)!.requiredRole;
  assert.equal(roleOf('/ticketing'), 'manageProducts');
  assert.equal(roleOf('/gate-control'), 'scanTicket');
  assert.equal(roleOf('/box-office'), 'sellAtBoxOffice');
  assert.equal(roleOf('/ticket-sales-report'), 'viewTicketSalesReport');
});
