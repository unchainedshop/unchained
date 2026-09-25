import type { Context } from '@unchainedshop/api';
import { acl } from '@unchainedshop/api';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';

export interface TicketAttendee {
  name: string | null;
  email: string | null;
  phone: string | null;
}

const fullName = (address?: { firstName?: string; lastName?: string } | null) =>
  [address?.firstName, address?.lastName].filter(Boolean).join(' ') || null;

/** The current ticket holder's contact details: what gate staff and event managers need, nothing more. */
export default async function attendee(
  token: TokenSurrogate,
  params: never,
  context: Context,
): Promise<TicketAttendee | null> {
  const { loaders, modules } = context;
  const product = await loaders.productLoader.load({ productId: token.productId });
  await acl.checkAction(context, 'viewAttendees', [product, params]);

  if (!token.userId) return null;
  const user = await loaders.userLoader.load({ userId: token.userId });
  if (!user) return null;

  return {
    name:
      user.profile?.displayName ||
      fullName(user.lastBillingAddress) ||
      fullName(user.profile?.address) ||
      user.username ||
      null,
    email: user.lastContact?.emailAddress || modules.users.primaryEmail(user)?.address || null,
    phone: user.lastContact?.telNumber || user.profile?.phoneMobile || null,
  };
}
