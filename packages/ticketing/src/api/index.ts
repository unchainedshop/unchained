import { acl } from '@unchainedshop/api';
import ticketEvents from './resolvers/queries/ticketEvents.ts';
import ticketEventsCount from './resolvers/queries/ticketEventsCount.ts';
import cancelTicket from './resolvers/mutations/cancelTicket.ts';
import cancelEvent from './resolvers/mutations/cancelEvent.ts';
import scanTicket from './resolvers/mutations/scanTicket.ts';
import attendee from './resolvers/type/attendee.ts';
import typeDefs from './schema.ts';
import { ticketingActions, configureTicketingRoles } from './roles.ts';

const { checkResolver } = acl;

const ticketingResolvers = {
  Query: {
    ticketEvents: checkResolver('gateControl')(ticketEvents),
    ticketEventsCount: checkResolver('gateControl')(ticketEventsCount),
  },
  Mutation: {
    scanTicket: checkResolver('scanTicket')(scanTicket),
    cancelTicket: checkResolver('cancelTicket')(cancelTicket),
    cancelEvent: checkResolver('cancelTicket')(cancelEvent),
  },
  TokenizedProduct: {
    isCanceled(product: any) {
      return Boolean(product.meta?.cancelled);
    },
  },
  Token: {
    isCanceled(token: any) {
      return Boolean(token.meta?.cancelled);
    },
    attendee,
  },
};

export { typeDefs as ticketingTypeDefs, ticketingResolvers, ticketingActions, configureTicketingRoles };
