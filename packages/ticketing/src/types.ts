import type { UnchainedCore } from '@unchainedshop/core';
import type { TicketingModule } from './module.js';
import { TicketingServices } from './services.js';

export type TicketingAPI = UnchainedCore & {
  modules: { passes: TicketingModule };
  services: TicketingServices;
};
