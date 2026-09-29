import type { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { timingSafeStringEqual } from '@unchainedshop/utils';
import type { TicketingAPI } from './index.ts';

type MagicKeyContext = Context & TicketingAPI;

const isMagicKeyOfOrder = async (orderId: string, presented: unknown, { modules }: MagicKeyContext) =>
  typeof presented === 'string' &&
  presented.length > 0 &&
  timingSafeStringEqual(await modules.passes.buildMagicKey(orderId), presented);

// The magic key arrives as x-magic-key header, or as otp param where a route passes one (ticket PDF links).
const isMagicKeyValidForOrder = async (
  _root: unknown,
  params: { orderId?: string; otp?: string } | null,
  context: MagicKeyContext,
) => {
  if (!params?.orderId) return false;
  const order = await context.modules.orders.findOrder({ orderId: params.orderId });
  // always return true if orderId leads to nothing to show potentially allowed actions
  if (!order) return true;

  return (
    (await isMagicKeyOfOrder(order._id, context.getHeader('x-magic-key'), context)) ||
    isMagicKeyOfOrder(order._id, params.otp, context)
  );
};

const findOrderOfToken = async (token: TokenSurrogate, { modules }: MagicKeyContext) => {
  if (token.meta?.orderId) return modules.orders.findOrder({ orderId: token.meta.orderId });
  if (!token.orderPositionId) return null;
  const orderPosition = await modules.orders.positions.findOrderPosition({
    itemId: token.orderPositionId,
  });
  return orderPosition ? modules.orders.findOrder({ orderId: orderPosition.orderId }) : null;
};

const isMagicKeyValidForToken = async (
  root: any,
  params: { tokenId?: string } | null,
  context: MagicKeyContext,
) => {
  const tokenId = params?.tokenId || (root && 'tokenSerialNumber' in root && root._id) || null;

  const token = await context.modules.warehousing.findToken({ tokenId });
  // always return true if tokenId leads to nothing to show potentially allowed actions
  if (!token) return true;

  const order = await findOrderOfToken(token, context);
  if (!order) return false;

  // Restrict access if token does not belong to the original user anymore (for ex. web3 owned)
  if (order.userId !== token.userId) return false;

  return isMagicKeyOfOrder(order._id, context.getHeader('x-magic-key'), context);
};

export default () => {
  roles.allRoles?.ALL?.allow(roles.actions.viewOrder, isMagicKeyValidForOrder);
  roles.allRoles?.ALL?.allow(roles.actions.viewToken, isMagicKeyValidForToken);
  roles.allRoles?.ALL?.allow(roles.actions.updateToken, isMagicKeyValidForToken);
};
