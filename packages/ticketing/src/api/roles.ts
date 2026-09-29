import type { Context } from '@unchainedshop/api';
import { NoPermissionError, roles } from '@unchainedshop/api';
import { ProductStatus, ProductType, type Product } from '@unchainedshop/core-products';

export const ticketingActions = ['scanTicket', 'gateControl', 'cancelTicket'];

/**
 * Narrows the ticket events a non-admin with ticketing access may work with (organizer scope).
 * It can only take access away, never grant it, and is never asked for administrators.
 */
export type CanAccessTicketEvent = (event: Product, context: Context) => boolean | Promise<boolean>;

export interface TicketingRolesOptions {
  /**
   * Restricts which ticket events non-admins see in Gate Control and the event lists, may look
   * tickets up in, redeem, cancel and edit. Project roles that grant viewTokens, viewToken or
   * updateToken themselves are not narrowed by it.
   */
  canAccessEvent?: CanAccessTicketEvent;
}

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

/** The roles package itself treats the role named admin as the administrator. */
export const isAdministrator = (context: Context | null) =>
  Boolean(context?.user?.roles?.includes('admin'));

// Role rules run once per resolved field and event lists check viewTokens for every event,
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

// The scope belongs to one roles instance (keyed by its __all__ role, which holds the ticketing
// rules), so the resolvers of a platform apply exactly the predicates its roles were built with.
const eventScopes = new WeakMap<object, Set<CanAccessTicketEvent>>();
const rulesRegistered = new WeakSet<object>();
const scopeByRequest = new WeakMap<Context, Map<string, Promise<boolean>>>();
const scopeOfConfigurator = new WeakMap<object, CanAccessTicketEvent | undefined>();

const getEventScopes = (context: Context | null) => {
  const allRole = context?.roles?.allRole;
  return allRole ? eventScopes.get(allRole) : undefined;
};

/** Whether the viewer's event lists and lookups have to be narrowed by an organizer scope. */
export function hasTicketEventScope(context: Context | null): boolean {
  return Boolean(getEventScopes(context)?.size) && !isAdministrator(context);
}

/**
 * Whether the organizer scope lets the viewer work with this event. True without a scope and for
 * administrators; false for a missing event when a scope applies. Evaluated once per request and event.
 */
export async function isTicketEventInScope(
  event: Product | null | undefined,
  context: Context | null,
): Promise<boolean> {
  if (!hasTicketEventScope(context)) return true;
  if (!event?._id) return false;
  if (!scopeByRequest.has(context!)) scopeByRequest.set(context!, new Map());
  const decisions = scopeByRequest.get(context!)!;
  if (!decisions.has(event._id)) {
    decisions.set(
      event._id,
      (async () => {
        for (const canAccessEvent of getEventScopes(context)!) {
          if (!(await canAccessEvent(event, context!))) return false;
        }
        return true;
      })(),
    );
  }
  return decisions.get(event._id)!;
}

/** Throws NoPermissionError when the event is outside the viewer's organizer scope. */
export async function assertTicketEventInScope(
  event: Product | null | undefined,
  context: Context,
  action: string,
): Promise<void> {
  if (await isTicketEventInScope(event, context)) return;
  throw new NoPermissionError({
    userId: context.userId,
    action,
    message: `The user "${context.userId}" has no permission to perform the action "${action}" for this event`,
  });
}

/**
 * Whether the viewer may see this ticket event and its tickets through ticketing: gate staff the
 * active events, product managers drafts as well, both limited by the organizer scope.
 */
export async function canWorkWithTicketEvent(
  event: Product | null | undefined,
  context: Context | null,
): Promise<boolean> {
  if (!isTicketEvent(event)) return false;
  const access = await resolveTicketingAccess(context);
  if (!access) return false;
  if (!access.includeDrafts && !isActiveTicketEvent(event)) return false;
  return isTicketEventInScope(event, context);
}

// gateControl is checked without a root for menus and lists, and with the event for one event.
const isEventRoot = (root: unknown): root is Product =>
  Boolean(root && typeof root === 'object' && '_id' in root);

/**
 * Builds the `ticketing` role configurator for rolesOptions.additionalRoles. The role grants
 * scanTicket; the rules for Gate Control and an event's tickets are added to the ALL role once per
 * roles instance, so the configurator may be used for several roles.
 */
export function createTicketingRoles({ canAccessEvent }: TicketingRolesOptions = {}) {
  const configure = (role: any, actions: Record<string, string>) => {
    const { allRoles } = roles;

    // Assign this role to gate operators. Administrators receive all registered actions.
    // User.allowedActions evaluates role rules with a null context to enumerate capabilities.
    role.allow(
      actions.scanTicket,
      (_root: never, _params: never, context: Context | null) =>
        context === null || isAuthenticated(context),
    );

    const allRole = allRoles.ALL;
    if (canAccessEvent) {
      if (!eventScopes.has(allRole)) eventScopes.set(allRole, new Set());
      eventScopes.get(allRole)!.add(canAccessEvent);
    }
    if (rulesRegistered.has(allRole)) return;
    rulesRegistered.add(allRole);

    allRole.allow(actions.gateControl, async (event: unknown, _params: never, context: Context) => {
      if (!isEventRoot(event)) return Boolean(await resolveTicketingAccess(context));
      return canWorkWithTicketEvent(event, context);
    });
    // Gate staff and event managers see an event's tickets. Token.user then only exposes the
    // ticket holder's public profile (viewUserPublicInfos); private fields stay admin-only.
    allRole.allow(
      actions.viewTokens,
      async (product: Product | undefined, _params: never, context: Context) =>
        canWorkWithTicketEvent(product, context),
    );
  };
  scopeOfConfigurator.set(configure, canAccessEvent);
  return configure;
}

/** Whether a role configurator was built by createTicketingRoles with exactly this scope. */
export function isTicketingRolesWithScope(
  configure: unknown,
  canAccessEvent: CanAccessTicketEvent | undefined,
): boolean {
  return (
    typeof configure === 'function' &&
    scopeOfConfigurator.has(configure) &&
    scopeOfConfigurator.get(configure) === canAccessEvent
  );
}

/** The `ticketing` role without an organizer scope. */
export const configureTicketingRoles = createTicketingRoles();
