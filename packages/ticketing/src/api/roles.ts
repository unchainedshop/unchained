import type { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import { ProductStatus, ProductType, type Product } from '@unchainedshop/core-products';

export const ticketingActions = ['scanTicket', 'gateControl', 'cancelTicket'];

export function isActiveTicketEvent(product?: Product | null): product is Product {
  return product?.type === ProductType.TOKENIZED_PRODUCT && product.status === ProductStatus.ACTIVE;
}

export function configureTicketingRoles(role: any, actions: Record<string, string>) {
  const { allRoles } = roles;
  const isAuthenticated = (context: Context) =>
    Boolean(context.userId && context.user && !context.user.guest);
  const canScan = async (_root: any, _params: any, context: Context) =>
    isAuthenticated(context) &&
    Boolean(await context.roles?.userHasPermission(context, actions.scanTicket, []));

  // Assign this role to gate operators. Administrators receive all registered actions.
  // User.allowedActions evaluates role rules with a null context to enumerate capabilities.
  role.allow(
    actions.scanTicket,
    (_root, _params, context: Context | null) => context === null || isAuthenticated(context),
  );

  allRoles.ALL.allow(
    actions.gateControl,
    async (root, params, context: Context) =>
      isAuthenticated(context) &&
      ((await canScan(root, params, context)) ||
        Boolean(
          await context.roles?.userHasPermission(context, actions.manageProducts, [root, params]),
        )),
  );
  allRoles.ALL.allow(
    actions.viewTokens,
    async (product: Product, params, context: Context) =>
      isActiveTicketEvent(product) && (await canScan(product, params, context)),
  );
  allRoles.ALL.allow(actions.viewUserPrivateInfos, async (user, params, context: Context) => {
    if (!user?._id || !(await canScan(user, params, context))) return false;
    const events = await context.modules.products.findProducts({
      type: ProductType.TOKENIZED_PRODUCT,
      includeDrafts: false,
    });
    if (!events.length) return false;
    const tokens = await context.modules.warehousing.findTokens({
      userId: user._id,
      productId: { $in: events.map(({ _id }) => _id) },
    });
    return tokens.length > 0;
  });
}
