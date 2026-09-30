import { type UnchainedCore } from '@unchainedshop/core';
import ticketingModules, { type TicketingModule, type TicketingOptions } from './module.ts';
import ticketingServices, { type TicketingServices } from './services.ts';
import type { DiscountCodeHandlers } from './discount-codes.ts';
import { registerTicketingTemplates, TicketingMessageTypes } from './templates/index.ts';
import {
  ticketingTypeDefs,
  ticketingResolvers,
  ticketingActions,
  configureTicketingRoles,
  createTicketingRoles,
  type TicketingRolesOptions,
} from './api/index.ts';

export type TicketingAPI = UnchainedCore & {
  modules: TicketingModule;
  services: TicketingServices;
};

export type {
  TicketingModule,
  TicketingServices,
  TicketingOptions,
  DiscountCodeHandlers,
  TicketingRolesOptions,
};

export {
  RendererTypes,
  type PDFRenderer,
  type PassRenderer,
  type GoogleWalletPassRenderer,
} from './template-registry.ts';
export { createTicketingPlugin, type TicketingPluginOptions } from './plugin.ts';
export {
  withTicketing,
  type WithTicketingOptions,
  type CanAccessTicketEvent,
} from './with-ticketing.ts';
export { getTicketingPaths, type TicketingPaths } from './routes.ts';
export {
  buildTicketsPdfUrl,
  buildWalletPassUrls,
  getTicketAttachments,
  type TicketAttachment,
} from './ticket-delivery.ts';
export {
  TicketEventProperty,
  getTicketEventDetails,
  getTicketEventStart,
  isTicketEventCancelled,
  isTicketCancelled,
  type TicketEventDetails,
} from './event-details.ts';
export { isWithinEntryWindow } from './entry-window.ts';
export {
  buildTicketScanPayload,
  parseTicketScanPayload,
  type TicketScanPayload,
} from './scan-payload.ts';
export {
  TicketingEventTypes,
  registerTicketingEvents,
  type TicketRedeemedEventPayload,
  type TicketCancelledEventPayload,
  type TicketEventCancelledEventPayload,
} from './events.ts';
export { TicketStatus, getTicketStatus } from './api/resolvers/type/token.ts';
export { TicketNotRedeemableReason } from './api/resolvers/mutations/scanTicket.ts';
export {
  createTicketOrderPositionValidator,
  validateTicketOrderPosition,
  type TicketSaleRules,
  type TicketSaleRulesInput,
  type TicketOrderPositionValidatorOptions,
  type TicketValidationAPI,
} from './validate-order-position.ts';
export {
  getDefaultTicketSaleRules,
  mergeTicketSaleRules,
  readTicketSaleRules,
  TICKET_SALE_RULE_KEYS,
  type UpdateTicketSaleRulesInput,
} from './sale-rules.ts';
export { TICKET_PRODUCTION_TAG, isTicketProduction } from './production.ts';

export {
  ticketingServices,
  ticketingModules,
  ticketingTypeDefs,
  ticketingResolvers,
  ticketingActions,
  configureTicketingRoles,
  createTicketingRoles,
  registerTicketingTemplates,
  TicketingMessageTypes,
};
