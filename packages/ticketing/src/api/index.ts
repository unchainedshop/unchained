import { acl } from '@unchainedshop/api';
import ticketEvents from './resolvers/queries/ticketEvents.ts';
import ticketEventsCount from './resolvers/queries/ticketEventsCount.ts';
import isPassCodeValid from './resolvers/queries/isPassCodeValid.ts';
import cancelTicket from './resolvers/mutations/cancelTicket.ts';
import cancelEvent from './resolvers/mutations/cancelEvent.ts';
import setEventScannerPassCode from './resolvers/mutations/setEventScannerPassCode.ts';
import authenticateGate from './resolvers/mutations/authenticateGate.ts';
import deauthenticateGate from './resolvers/mutations/deauthenticateGate.ts';
import typeDefs from './schema.ts';
import { ticketingActions, configureTicketingRoles } from './roles.ts';

const { checkResolver, checkAction } = acl;

const ticketingResolvers = {
  Query: {
    ticketEvents: checkResolver('gateControl')(ticketEvents),
    ticketEventsCount: checkResolver('gateControl')(ticketEventsCount),
    isPassCodeValid: checkResolver('validatePassCode')(isPassCodeValid),
  },
  Mutation: {
    cancelTicket: checkResolver('updateToken')(cancelTicket),
    cancelEvent: checkResolver('manageProducts')(cancelEvent),
    setEventScannerPassCode: checkResolver('manageProducts')(setEventScannerPassCode),
    authenticateGate: checkResolver('validatePassCode')(authenticateGate),
    deauthenticateGate: checkResolver('validatePassCode')(deauthenticateGate),
  },
  TokenizedProduct: {
    async scannerPassCode(product: any, params: never, requestContext: any) {
      await checkAction(requestContext, 'manageProducts', [undefined, params]);
      return (product.meta as Record<string, any>)?.scannerPassCode || null;
    },
    isCanceled(product: any) {
      return Boolean(product.meta?.cancelled);
    },
  },
  Token: {
    isCanceled(token: any) {
      return Boolean(token.meta?.cancelled);
    },
  },
};

export { typeDefs as ticketingTypeDefs, ticketingResolvers, ticketingActions, configureTicketingRoles };
