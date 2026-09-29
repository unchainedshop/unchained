import { createError } from '@unchainedshop/api';

export const TokenAlreadyRedeemedError = createError(
  'TokenAlreadyRedeemedError',
  'Cannot cancel a redeemed ticket',
);

export const TicketingModuleNotFoundError = createError(
  'TicketingModuleNotFoundError',
  'Ticketing module (passes) is not available, please configure @unchainedshop/ticketing',
);
