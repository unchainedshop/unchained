import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { definePlugin } from '@unchainedshop/admin-ui/plugins';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ticketingBundlePath = resolve(__dirname, '../admin-plugin/dist/index.js');

export const ticketingEntities = [
  {
    path: '/ticketing',
    label: 'Events',
    icon: 'ticket',
    sortOrder: 90,
    requiredRole: 'manageProducts',
    components: {
      list: 'TicketingPage',
      detail: 'TicketEventDetailPage',
      create: 'TicketProductionCreatePage',
    },
  },
];

export const ticketingPages = [
  {
    path: '/gate-control',
    label: 'Gate Control',
    icon: 'shield-check',
    sortOrder: 92,
    component: 'GateControlPage',
    requiredRole: 'scanTicket',
  },
  {
    path: '/box-office',
    label: 'Box Office',
    icon: 'banknotes',
    sortOrder: 93,
    component: 'BoxOfficePage',
    requiredRole: 'sellAtBoxOffice',
  },
  {
    path: '/ticket-sales-report',
    label: 'Sales Report',
    icon: 'document-chart-bar',
    sortOrder: 96,
    component: 'SalesReportPage',
    requiredRole: 'viewTicketSalesReport',
  },
];

/**
 * The "Ticketing" submenu. Admin UI plugins with the same navigation label share the submenu, so a
 * project adds its own pages with `navigation: ticketingNavigation` in its own plugin.
 */
export const ticketingNavigation = {
  label: 'Ticketing',
  icon: 'ticket',
  sortOrder: 90,
};

export function ticketingAdminPlugin() {
  return definePlugin({
    name: 'ticketing',
    version: '1.0.0',
    bundlePath: ticketingBundlePath,
    navigation: ticketingNavigation,
    slots: {
      entities: ticketingEntities,
      pages: ticketingPages,
    },
  });
}
