import type { UnchainedCore } from '@unchainedshop/types/core.js';
import type { TicketingModule } from './module.js';

export type TicketingAPI = UnchainedCore & {
  modules: { passes: TicketingModule };
};
