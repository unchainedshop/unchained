import type { Context } from '@unchainedshop/api';
import { roles } from '@unchainedshop/api';
import { ProductStatus, ProductType, type Product } from '@unchainedshop/core-products';

export const ticketingActions = ['scanTicket', 'gateControl', 'cancelTicket', 'viewAttendees'];

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

// Role rules run once per resolved field and attendee lists resolve one per ticket,
// so the viewer's access is derived once per request.
const accessByRequest = new WeakMap<Context, Promise<TicketingAccess | null>>();

/** The ticket events the current user may work with, or null for customers, guests and anonymous requests. */
export function resolveTicketingAccess(context: Context | null): Promise<TicketingAccess | null> {
  if (!isAuthenticated(context)) return Promise.resolve(null);
  if (!accessByRequest.has(context!)) {
    const allowed = (action: string) =>
      context!.roles?.userHasPermission(context!, action, [undefined, {}]);
    accessByRequest.set(
      context!,
      (async () => {
        if (await allowed('manageProducts')) return { includeDrafts: true };
        if (await allowed('scanTicket')) return { includeDrafts: false };
        return null;
      })(),
    );
  }
  return accessByRequest.get(context!)!;
}

async function canWorkWithEvent(product: Product | undefined, context: Context) {
  if (!isTicketEvent(product)) return false;
  const access = await resolveTicketingAccess(context);
  return Boolean(access && (access.includeDrafts || isActiveTicketEvent(product)));
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
  // Gate staff and event managers see an event's tickets and their Token.attendee contact
  // details, never the ticket holder's user account (viewUserPrivateInfos stays untouched).
  for (const action of [actions.viewTokens, actions.viewAttendees]) {
    allRoles.ALL.allow(action, (product: Product | undefined, _params: never, context: Context) =>
      canWorkWithEvent(product, context),
    );
  }
}
