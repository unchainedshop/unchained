import type { Context } from '../../../context.ts';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  TokenNotFoundError,
  TokenAlreadyRedeemedError,
  TicketingModuleNotFoundError,
} from '../../../errors.ts';

interface PassesModule {
  cancelTicket: (tokenId: string) => Promise<TokenSurrogate>;
}

export default async function cancelTicket(
  root: never,
  { tokenId }: { tokenId: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation cancelTicket ${tokenId}`, { userId });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });

  if (token.meta?.cancelled) {
    return token;
  }

  if (token.invalidatedDate) {
    throw new TokenAlreadyRedeemedError({ tokenId });
  }

  const passes = (modules as unknown as Record<string, unknown>).passes as PassesModule | undefined;
  if (!passes?.cancelTicket) {
    throw new TicketingModuleNotFoundError({});
  }

  return passes.cancelTicket(tokenId);
}
