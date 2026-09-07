import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ticketingBundlePath = resolve(__dirname, '../admin-plugin/dist/index.js');

export const ticketingEntities = [
  {
    path: '/ticketing',
    label: 'Events',
    icon: 'ticket',
    sortOrder: 90,
    components: {
      list: 'TicketingPage',
      detail: 'TicketEventDetailPage',
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
  },
];

export const ticketingLinks = [
  {
    href: '/ext/gate-control',
    label: 'Gate Control',
    icon: 'shield-check',
    showOnLoginPage: true,
  },
];

export const ticketingNavigation = {
  label: 'Ticketing',
  icon: 'ticket',
  sortOrder: 90,
};
