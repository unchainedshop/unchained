import type { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import { GATE_COOKIE_NAME } from './gate-cookie.ts';

export const ticketingActions = ['validatePassCode', 'gateControl'];

export function configureTicketingRoles(_role: any, actions: Record<string, string>) {
  const { allRoles } = roles;

  const hasValidPassCode = async (_root: any, _params: any, context: Context) => {
    const passCode = context.getCookie?.(GATE_COOKIE_NAME);
    if (!passCode) return false;
    const ticketingServices = (context.services as any)?.ticketing;
    if (!ticketingServices?.isPassCodeValid) return false;
    return ticketingServices.isPassCodeValid(passCode);
  };

  const hasValidPassCodeForProduct = async (root: any, _params: any, context: Context) => {
    if (!root?._id) return false;
    const passCode = context.getCookie?.(GATE_COOKIE_NAME);
    if (!passCode) return false;
    const ticketingServices = (context.services as any)?.ticketing;
    if (!ticketingServices?.isPassCodeValid) return false;
    return ticketingServices.isPassCodeValid(passCode, root._id);
  };

  const hasValidPassCodeForToken = async (_root: any, params: any, context: Context) => {
    const passCode = context.getCookie?.(GATE_COOKIE_NAME);
    if (!passCode) return false;
    const ticketingServices = (context.services as any)?.ticketing;
    if (!ticketingServices?.isPassCodeValid) return false;
    const tokenId = params?.tokenId;
    if (!tokenId) return false;
    const token = await context.modules.warehousing.findToken({ tokenId });
    if (!token) return false;
    return ticketingServices.isPassCodeValid(passCode, token.productId);
  };

  // ALL role: gate control permissions
  allRoles.ALL.allow(actions.validatePassCode, () => true);
  allRoles.ALL.allow(actions.gateControl, hasValidPassCode);
  allRoles.ALL.allow(actions.viewTokens, hasValidPassCodeForProduct);
  allRoles.ALL.allow(actions.updateToken, hasValidPassCodeForToken);
  allRoles.ALL.allow(actions.viewUserPrivateInfos, hasValidPassCode);

  // LOGGEDIN role: gate control always allowed
  allRoles.LOGGEDIN.allow(actions.validatePassCode, () => true);
  allRoles.LOGGEDIN.allow(actions.gateControl, () => true);
}
