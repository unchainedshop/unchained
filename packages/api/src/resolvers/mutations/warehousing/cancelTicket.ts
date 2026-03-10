import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, TokenNotFoundError } from '../../../errors.ts';

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

  // Use ticketing module if available, otherwise update directly
  if ((modules as any).passes?.cancelTicket) {
    return (modules as any).passes.cancelTicket(tokenId);
  }

  // Fallback: directly update token meta
  const tokens = await modules.warehousing.findTokens({ _id: tokenId });
  const existingToken = tokens[0];
  if (!existingToken) throw new TokenNotFoundError({ tokenId });

  // Invalidate the token and mark as cancelled
  await modules.warehousing.invalidateToken(tokenId);
  const updatedToken = await modules.warehousing.findToken({ tokenId });
  return updatedToken;
}
