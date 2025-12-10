import type { UnchainedCore } from '@unchainedshop/core';
import type { TicketingModule } from './module.ts';
import type { TicketingServices } from './services.ts';

export type TicketingAPI = UnchainedCore & {
  modules: TicketingModule;
  services: TicketingServices;
};
