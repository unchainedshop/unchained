import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { InvalidIdError, ProductNotFoundError, TokenNotFoundError } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import {
  TicketExchangeInvalidError,
  TicketProductionLockedError,
  TicketSoldOutError,
  TicketingModuleNotFoundError,
  TokenAlreadyRedeemedError,
} from '../../errors.ts';
import { assertTicketEventInScope, hasTicketEventScope } from '../../roles.ts';

const EXCHANGE_ERRORS = {
  TICKET_NOT_FOUND: TokenNotFoundError,
  TICKET_EXCHANGE_INVALID: TicketExchangeInvalidError,
  TICKET_ALREADY_REDEEMED: TokenAlreadyRedeemedError,
  TICKET_SOLD_OUT: TicketSoldOutError,
  LOCKED: TicketProductionLockedError,
};

export default async function exchangeTickets(
  _root: never,
  { tokenIds, productId }: { tokenIds: string[]; productId: string },
  context: Context,
  info: GraphQLResolveInfo,
) {
  const { modules, services, userId } = context;
  log(`mutation exchangeTickets ${productId}`, { userId, tokenIds });

  if (!productId || !tokenIds?.length) throw new InvalidIdError({ productId, tokenIds });
  const target = await modules.products.findProduct({ productId });
  if (!target) throw new ProductNotFoundError({ productId });

  // A role granted cancelTicket stays within its organizer scope, on both dates.
  if (hasTicketEventScope(context)) {
    await assertTicketEventInScope(target, context, 'cancelTicket', info);
    const tokens = await modules.warehousing.findTokens({ _id: { $in: tokenIds } });
    for (const sourceId of new Set(tokens.map((token) => token.productId))) {
      const source = await modules.products.findProduct({ productId: sourceId });
      await assertTicketEventInScope(source, context, 'cancelTicket', info);
    }
  }

  const ticketing = (services as unknown as any).ticketing;
  if (!ticketing?.exchangeTickets) throw new TicketingModuleNotFoundError({});

  try {
    return await ticketing.exchangeTickets({ tokenIds, productId });
  } catch (error) {
    const ErrorClass = EXCHANGE_ERRORS[(error as Error)?.cause as keyof typeof EXCHANGE_ERRORS];
    if (ErrorClass) throw new ErrorClass({ productId, tokenIds, message: (error as Error).message });
    throw error;
  }
}
