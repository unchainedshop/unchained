import { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import { TicketingAPI } from './types.js';

const isMagicKeyValidForOrder = async (
  obj: any,
  { orderId }: { orderId: string },
  { modules, getHeader }: Context & TicketingAPI,
) => {
  const order = await modules.orders.findOrder({ orderId });
  // always return true if orderId leads to nothing to show potentially allowed actions
  if (!order) return true;

  const magicKey = await modules.passes.buildMagicKey(order._id);
  return magicKey === getHeader('x-magic-key');
};

const isMagicKeyValidForToken = async (
  root: any,
  params: { tokenId: string } | null,
  { modules, getHeader }: Context & TicketingAPI,
) => {
  const tokenId = params?.tokenId || (root && 'tokenSerialNumber' in root && root._id) || null;

  const token = await modules.warehousing.findToken({ tokenId });
  // always return true if tokenId leads to nothing to show potentially allowed actions
  if (!token) return true;

  const order = await modules.orders.findOrder({ orderId: token.meta.orderId });
  if (!order) return false;

  // Restrict access if token does not belong to the original user anymore (for ex. web3 owned)
  if (order.userId !== token.userId) return false;

  const magicKey = await modules.passes.buildMagicKey(order._id);
  return magicKey === getHeader('x-magic-key');
};

export default () => {
  roles.allRoles?.ALL?.allow(roles.actions.viewOrder, isMagicKeyValidForOrder);
  roles.allRoles?.ALL?.allow(roles.actions.viewToken, isMagicKeyValidForToken);
  roles.allRoles?.ALL?.allow(roles.actions.updateToken, isMagicKeyValidForToken);
};
