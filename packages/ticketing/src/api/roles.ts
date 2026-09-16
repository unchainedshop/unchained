import type { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import { GATE_COOKIE_NAME } from './gate-cookie.ts';

export const ticketingActions = ['validatePassCode', 'gateControl', 'cancelTicket'];

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

  const isAuthorizedAttendee = async (user: any, _params: any, context: Context) => {
    const passCode = context.getCookie?.(GATE_COOKIE_NAME);
    if (!passCode || !user?._id) return false;
    const ticketingServices = (context.services as any)?.ticketing;
    if (!ticketingServices?.productIdsForPassCode) return false;
    const productIds = await ticketingServices.productIdsForPassCode(passCode);
    if (!productIds.length) return false;
    const tokens = await context.modules.warehousing.findTokens({
      userId: user._id,
      productId: { $in: productIds },
    });
    return tokens.length > 0;
  };

  // ALL role: gate control permissions
  allRoles.ALL.allow(actions.validatePassCode, () => true);
  allRoles.ALL.allow(actions.gateControl, hasValidPassCode);
  allRoles.ALL.allow(actions.viewTokens, hasValidPassCodeForProduct);
  allRoles.ALL.allow(actions.updateToken, hasValidPassCodeForToken);
  allRoles.ALL.allow(actions.viewUserPrivateInfos, isAuthorizedAttendee);

  // Staff may administer events without a scanner cookie. Customer sessions
  // still need an event-scoped pass code, just like anonymous gate operators.
  allRoles.ALL.allow(actions.gateControl, (root, params, context) =>
    context.roles.userHasPermission(context, actions.manageProducts, [root, params]),
  );
}
