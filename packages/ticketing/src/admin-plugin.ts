import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TicketingAdminPluginOptions {
  version?: string;
}

export function ticketingAdminPlugin(options: TicketingAdminPluginOptions = {}) {
  return {
    name: 'ticketing',
    version: options.version || '1.0.0',
    bundlePath: resolve(__dirname, '../admin-plugin/dist/index.global.js'),
    navigation: {
      label: 'Ticketing',
      icon: 'ticket',
      sortOrder: 90,
    },
    slots: {
      entities: [
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
      ],
      pages: [
        {
          path: '/gate-control',
          label: 'Gate Control',
          icon: 'shield-check',
          sortOrder: 92,
          component: 'GateControlPage',
        },
      ],
      links: [
        {
          href: '/ext/gate-control',
          label: 'Gate Control',
          icon: 'shield-check',
          showOnLoginPage: true,
        },
      ],
    },
  };
}
