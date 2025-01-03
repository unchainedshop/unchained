import { UnchainedCore } from '@unchainedshop/core';
import { TicketingModule } from './module.js';
import { TicketingServices } from './services.js';

export type TicketingAPI = UnchainedCore & {
  modules: TicketingModule;
  services: TicketingServices;
};
