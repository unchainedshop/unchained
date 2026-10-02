import type { IPlugin } from '@unchainedshop/core';
import {
  TICKET_WAREHOUSING_ADAPTER_KEY,
  createTicketWarehousingAdapter,
  type TicketWarehousingOptions,
} from './adapter.ts';

/**
 * The ticket issuer plugin. Register it next to createTicketingPlugin() and create exactly one
 * VIRTUAL warehousing provider with the adapter key `shop.unchained.warehousing.ticket`: every
 * active VIRTUAL provider issues tokens, so a second one (e.g. the ETH minter) issues every
 * ticket twice.
 */
export function createTicketWarehousingPlugin(options: TicketWarehousingOptions = {}): IPlugin {
  return {
    key: TICKET_WAREHOUSING_ADAPTER_KEY,
    label: 'Ticket Issuer',
    version: '1.0.0',

    adapters: [createTicketWarehousingAdapter(options)],
  };
}

export const TicketWarehousingPlugin: IPlugin = createTicketWarehousingPlugin();

export default TicketWarehousingPlugin;

export {
  TICKET_WAREHOUSING_ADAPTER_KEY,
  createTicketWarehousingAdapter,
  ATTENDEES_CONFIGURATION_KEY,
  readAttendeeName,
  type TicketWarehousingOptions,
  type TicketMetaInput,
  type TicketIssuerAPI,
} from './adapter.ts';
