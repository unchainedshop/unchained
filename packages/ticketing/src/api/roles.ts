import type { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import { ProductStatus, ProductType, type Product } from '@unchainedshop/core-products';

export const ticketingActions = ['scanTicket', 'gateControl', 'cancelTicket'];

export interface TicketingAccess {
  /** Product managers may work with draft events, gate operators only with active ones. */
  includeDrafts: boolean;
}

export function isTicketEvent(product?: Product | null): product is Product {
  return product?.type === ProductType.TOKENIZED_PRODUCT;
}

export function isActiveTicketEvent(product?: Product | null): product is Product {
  return isTicketEvent(product) && product.status === ProductStatus.ACTIVE;
}

const isAuthenticated = (context: Context | null) =>
  Boolean(context?.userId && context.user && !context.user.guest);

// Role rules run once per resolved field, and attendee lists resolve several private
// fields per ticket. Everything derived from the request is therefore cached on it.
const perRequest = <T>(compute: (context: Context) => T) => {
  const cache = new WeakMap<Context, T>();
  return (context: Context): T => {
    if (!cache.has(context)) cache.set(context, compute(context));
    return cache.get(context)!;
  };
};

const ticketingAccess = perRequest(async (context): Promise<TicketingAccess | null> => {
  const allowed = (action: string) => context.roles?.userHasPermission(context, action, [undefined, {}]);
  if (await allowed('manageProducts')) return { includeDrafts: true };
  if (await allowed('scanTicket')) return { includeDrafts: false };
  return null;
});

/** The ticket events the current user may work with, or null for customers, guests and anonymous requests. */
export async function resolveTicketingAccess(context: Context | null): Promise<TicketingAccess | null> {
  if (!isAuthenticated(context)) return null;
  return ticketingAccess(context!);
}

const accessibleEventIds = perRequest(async (context): Promise<Set<string>> => {
  const access = await resolveTicketingAccess(context);
  if (!access) return new Set();
  const productIds = await context.modules.products.findProductIds({
    type: ProductType.TOKENIZED_PRODUCT,
    includeDrafts: access.includeDrafts,
  });
  return new Set(productIds);
});

const ticketHolders = perRequest(() => new Map<string, Promise<boolean>>());

/** Whether a user holds a ticket for an event the current user may work with. */
function isTicketHolder(context: Context, userId: string): Promise<boolean> {
  const holders = ticketHolders(context);
  if (!holders.has(userId)) {
    holders.set(
      userId,
      (async () => {
        const eventIds = await accessibleEventIds(context);
        if (!eventIds.size) return false;
        const tokens = await context.modules.warehousing.findTokensForUser({ userId });
        return tokens.some((token) => eventIds.has(token.productId));
      })(),
    );
  }
  return holders.get(userId)!;
}

export function configureTicketingRoles(role: any, actions: Record<string, string>) {
  const { allRoles } = roles;

  // Assign this role to gate operators. Administrators receive all registered actions.
  // User.allowedActions evaluates role rules with a null context to enumerate capabilities.
  role.allow(
    actions.scanTicket,
    (_root: never, _params: never, context: Context | null) =>
      context === null || isAuthenticated(context),
  );

  allRoles.ALL.allow(actions.gateControl, async (_root: never, _params: never, context: Context) =>
    Boolean(await resolveTicketingAccess(context)),
  );
  allRoles.ALL.allow(
    actions.viewTokens,
    async (product: Product | undefined, _params: never, context: Context) => {
      if (!isTicketEvent(product)) return false;
      const access = await resolveTicketingAccess(context);
      return Boolean(access && (access.includeDrafts || isActiveTicketEvent(product)));
    },
  );
  allRoles.ALL.allow(
    actions.viewUserPrivateInfos,
    async (user: { _id?: string } | undefined, _params: never, context: Context) =>
      Boolean(user?._id && (await resolveTicketingAccess(context))) &&
      isTicketHolder(context, user!._id!),
  );
}
