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
