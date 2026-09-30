import { acl } from '@unchainedshop/api';
import ticketEvents from './resolvers/queries/ticketEvents.ts';
import ticketEventsCount from './resolvers/queries/ticketEventsCount.ts';
import ticketLookup from './resolvers/queries/ticketLookup.ts';
import ticketProductions from './resolvers/queries/ticketProductions.ts';
import ticketProductionsCount from './resolvers/queries/ticketProductionsCount.ts';
import cancelTicket from './resolvers/mutations/cancelTicket.ts';
import cancelEvent from './resolvers/mutations/cancelEvent.ts';
import scanTicket from './resolvers/mutations/scanTicket.ts';
import updateTicketEvent from './resolvers/mutations/updateTicketEvent.ts';
import createTicketProduction from './resolvers/mutations/createTicketProduction.ts';
import addTicketPerformance from './resolvers/mutations/addTicketPerformance.ts';
import updateTicketPerformance from './resolvers/mutations/updateTicketPerformance.ts';
import removeTicketPerformance from './resolvers/mutations/removeTicketPerformance.ts';
import publishTicketProduction from './resolvers/mutations/publishTicketProduction.ts';
import unpublishTicketProduction from './resolvers/mutations/unpublishTicketProduction.ts';
import { ConfigurableProduct, TicketProduction } from './resolvers/type/configurable-product.ts';
import { Order } from './resolvers/type/order.ts';
import { Token } from './resolvers/type/token.ts';
import { TicketEvent, TokenizedProduct } from './resolvers/type/tokenized-product.ts';
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
    ticketProductions: checkResolver('manageProducts')(ticketProductions),
    ticketProductionsCount: checkResolver('manageProducts')(ticketProductionsCount),
  },
  Mutation: {
    scanTicket: checkResolver('scanTicket')(scanTicket),
    cancelTicket: checkResolver('cancelTicket')(cancelTicket),
    cancelEvent: checkResolver('cancelTicket')(cancelEvent),
    updateTicketEvent: checkResolver('manageProducts')(updateTicketEvent),
    createTicketProduction: checkResolver('manageProducts')(createTicketProduction),
    addTicketPerformance: checkResolver('manageProducts')(addTicketPerformance),
    updateTicketPerformance: checkResolver('manageProducts')(updateTicketPerformance),
    removeTicketPerformance: checkResolver('manageProducts')(removeTicketPerformance),
    publishTicketProduction: checkResolver('manageProducts')(publishTicketProduction),
    unpublishTicketProduction: checkResolver('manageProducts')(unpublishTicketProduction),
  },
  TokenizedProduct,
  TicketEvent,
  ConfigurableProduct,
  TicketProduction,
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
