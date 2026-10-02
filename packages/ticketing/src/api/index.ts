import { acl } from '@unchainedshop/api';
import ticketEvents from './resolvers/queries/ticketEvents.ts';
import ticketEventsCount from './resolvers/queries/ticketEventsCount.ts';
import ticketLookup from './resolvers/queries/ticketLookup.ts';
import ticketProductions from './resolvers/queries/ticketProductions.ts';
import ticketProductionsCount from './resolvers/queries/ticketProductionsCount.ts';
import ticketSalesReport from './resolvers/queries/ticketSalesReport.ts';
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
import updateTicketProduction from './resolvers/mutations/updateTicketProduction.ts';
import syncTicketProduction from './resolvers/mutations/syncTicketProduction.ts';
import removeTicketProduction from './resolvers/mutations/removeTicketProduction.ts';
import cancelTicketPerformance from './resolvers/mutations/cancelTicketPerformance.ts';
import addTicketCategory from './resolvers/mutations/addTicketCategory.ts';
import updateTicketCategory from './resolvers/mutations/updateTicketCategory.ts';
import removeTicketCategory from './resolvers/mutations/removeTicketCategory.ts';
import { ConfigurableProduct, TicketProduction } from './resolvers/type/configurable-product.ts';
import { Order } from './resolvers/type/order.ts';
import { Token } from './resolvers/type/token.ts';
import { TicketEvent, TokenizedProduct } from './resolvers/type/tokenized-product.ts';
import typeDefs from './schema.ts';
import {
  ticketingActions,
  configureTicketingRoles,
  createTicketingRoles,
  isGateTicketHolder,
  GATE_CONTACT_HOURS_BEFORE_START,
  GATE_CONTACT_HOURS_AFTER_START,
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
    ticketSalesReport: checkResolver('viewTicketSalesReport')(ticketSalesReport),
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
    updateTicketProduction: checkResolver('manageProducts')(updateTicketProduction),
    syncTicketProduction: checkResolver('manageProducts')(syncTicketProduction),
    removeTicketProduction: checkResolver('manageProducts')(removeTicketProduction),
    cancelTicketPerformance: checkResolver('cancelTicket')(cancelTicketPerformance),
    addTicketCategory: checkResolver('manageProducts')(addTicketCategory),
    updateTicketCategory: checkResolver('manageProducts')(updateTicketCategory),
    removeTicketCategory: checkResolver('manageProducts')(removeTicketCategory),
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
  isGateTicketHolder,
  GATE_CONTACT_HOURS_BEFORE_START,
  GATE_CONTACT_HOURS_AFTER_START,
  type CanAccessTicketEvent,
  type TicketingRolesOptions,
};
