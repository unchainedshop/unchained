import { acl } from '@unchainedshop/api';
import ticketEvents from './resolvers/queries/ticketEvents.ts';
import ticketEventsCount from './resolvers/queries/ticketEventsCount.ts';
import ticketLookup from './resolvers/queries/ticketLookup.ts';
import cancelTicket from './resolvers/mutations/cancelTicket.ts';
import cancelEvent from './resolvers/mutations/cancelEvent.ts';
import scanTicket from './resolvers/mutations/scanTicket.ts';
import updateTicketEvent from './resolvers/mutations/updateTicketEvent.ts';
import { Order } from './resolvers/type/order.ts';
import { Token } from './resolvers/type/token.ts';
import { TokenizedProduct } from './resolvers/type/tokenized-product.ts';
import typeDefs from './schema.ts';
import {
  ticketingActions,
  configureTicketingRoles,
  createTicketingRoles,
  type CanAccessTicketEvent,
  type TicketingRolesOptions,
} from './roles.ts';

const { checkResolver } = acl;

const ticketingResolvers = {
  Query: {
    ticketEvents: checkResolver('gateControl')(ticketEvents),
    ticketEventsCount: checkResolver('gateControl')(ticketEventsCount),
    ticketLookup: checkResolver('gateControl')(ticketLookup),
  },
  Mutation: {
    scanTicket: checkResolver('scanTicket')(scanTicket),
    cancelTicket: checkResolver('cancelTicket')(cancelTicket),
    cancelEvent: checkResolver('cancelTicket')(cancelEvent),
    updateTicketEvent: checkResolver('manageProducts')(updateTicketEvent),
  },
  TokenizedProduct,
  Token,
  Order,
};

export {
  typeDefs as ticketingTypeDefs,
  ticketingResolvers,
  ticketingActions,
  configureTicketingRoles,
  createTicketingRoles,
  type CanAccessTicketEvent,
  type TicketingRolesOptions,
};
