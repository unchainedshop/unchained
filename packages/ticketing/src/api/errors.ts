import { createError } from '@unchainedshop/api';

export const TokenAlreadyRedeemedError = createError(
  'TokenAlreadyRedeemedError',
  'Cannot cancel a redeemed ticket',
);

export const TicketingModuleNotFoundError = createError(
  'TicketingModuleNotFoundError',
  'Ticketing module (passes) is not available, please configure @unchainedshop/ticketing',
);

// Buying tickets (validateTicketOrderPosition). Cart mutations return the code in
// extensions.code, checkoutCart as OrderCheckoutError detailCode.

export const TicketSoldOutError = createError('TicketSoldOutError', 'Not enough tickets left');

export const TicketEventCancelledError = createError(
  'TicketEventCancelledError',
  'The event has been cancelled',
);

export const TicketNotOnSaleError = createError(
  'TicketNotOnSaleError',
  'Tickets for this event are not on sale',
);

export const TicketSaleNotStartedError = createError(
  'TicketSaleNotStartedError',
  'The ticket sale has not started yet',
);

export const TicketSaleEndedError = createError('TicketSaleEndedError', 'The ticket sale has ended');

export const TicketOrderLimitExceededError = createError(
  'TicketOrderLimitExceededError',
  'Too many tickets for this event in one order',
);

// Redeeming tickets at the gate (scanTicket).

export const TicketCanceledError = createError(
  'TicketCanceledError',
  'The ticket or its event has been cancelled',
);

export const TicketAlreadyRedeemedError = createError(
  'TicketAlreadyRedeemedError',
  'The ticket has already been redeemed',
);

export const TicketWrongEventError = createError(
  'TicketWrongEventError',
  'The ticket is for another event',
);

export const TicketNotRedeemableError = createError(
  'TicketNotRedeemableError',
  'The ticket cannot be redeemed now',
);

export const TicketAccessKeyInvalidError = createError(
  'TicketAccessKeyInvalidError',
  'The ticket code does not match the ticket (outdated or forged)',
);

export const InvalidTicketSaleRulesError = createError(
  'InvalidTicketSaleRulesError',
  'Sale rules need dates for salesStart and salesEnd and a maxPerOrder of at least 0',
);

export const TicketProductionNotFoundError = createError(
  'TicketProductionNotFoundError',
  'Ticket production not found',
);

export const TicketPerformanceNotFoundError = createError(
  'TicketPerformanceNotFoundError',
  'The production has no performance with this start',
);

export const TicketPerformanceExistsError = createError(
  'TicketPerformanceExistsError',
  'The production already has a performance with this start',
);

export const TicketPerformanceHasTicketsError = createError(
  'TicketPerformanceHasTicketsError',
  'Tickets exist, cancel instead of removing',
);

export const TicketSupplyBelowSoldError = createError(
  'TicketSupplyBelowSoldError',
  'The supply cannot be lower than the tickets that are sold or reserved',
);

export const TicketCategoryNotFoundError = createError(
  'TicketCategoryNotFoundError',
  'The production has no ticket category with this code',
);

export const TicketCategoryExistsError = createError(
  'TicketCategoryExistsError',
  'The production already has a ticket category with this code',
);

export const InvalidTicketProductionError = createError(
  'InvalidTicketProductionError',
  'Invalid production, performance, category or price',
);

export const TicketPerformanceManagedError = createError(
  'TicketPerformanceManagedError',
  'The start and category of a performance are changed through its production',
);

const PRODUCTION_ERRORS = {
  TICKET_PRODUCTION_NOT_FOUND: TicketProductionNotFoundError,
  TICKET_PERFORMANCE_NOT_FOUND: TicketPerformanceNotFoundError,
  TICKET_PERFORMANCE_EXISTS: TicketPerformanceExistsError,
  TICKET_PERFORMANCE_HAS_TICKETS: TicketPerformanceHasTicketsError,
  TICKET_CATEGORY_HAS_TICKETS: TicketPerformanceHasTicketsError,
  TICKET_SUPPLY_BELOW_SOLD: TicketSupplyBelowSoldError,
  TICKET_CATEGORY_NOT_FOUND: TicketCategoryNotFoundError,
  TICKET_CATEGORY_EXISTS: TicketCategoryExistsError,
  INVALID_TICKET_SALE_RULES: InvalidTicketSaleRulesError,
  INVALID_TICKET_CATEGORY_CODE: InvalidTicketProductionError,
  INVALID_TICKET_CATEGORY: InvalidTicketProductionError,
  INVALID_TICKET_PERFORMANCE: InvalidTicketProductionError,
  INVALID_TICKET_PRODUCTION: InvalidTicketProductionError,
  INVALID_TICKET_PRICE: InvalidTicketProductionError,
} as const;

/** Runs a production service and turns the cause codes of its errors into GraphQL errors. */
export async function withTicketProductionErrors<T>(
  run: () => Promise<T>,
  data: Record<string, unknown> = {},
): Promise<T> {
  try {
    return await run();
  } catch (error: any) {
    const ErrorClass = PRODUCTION_ERRORS[error?.cause as keyof typeof PRODUCTION_ERRORS];
    if (ErrorClass) throw new ErrorClass({ ...data, message: error.message });
    throw error;
  }
}
