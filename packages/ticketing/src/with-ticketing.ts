import { createLogger } from '@unchainedshop/logger';
import ticketingServices from './services.ts';
import {
  ticketingTypeDefs,
  ticketingResolvers,
  ticketingActions,
  configureTicketingRoles,
  createTicketingRoles,
  type CanAccessTicketEvent,
} from './api/index.ts';
import { isTicketingRolesWithScope } from './api/roles.ts';

const logger = createLogger('unchained:ticketing');

export type { CanAccessTicketEvent };

export interface WithTicketingOptions {
  /**
   * Organizer scope: narrows the ticket events non-admins may list, look tickets up in, redeem,
   * cancel and edit. It can only take access away, never grant it.
   */
  canAccessEvent?: CanAccessTicketEvent;
}

// The parts of the startPlatform options ticketing extends, typed structurally so ticketing
// does not depend on @unchainedshop/platform.
interface TicketingPlatformOptions {
  services?: Record<string, any>;
  typeDefs?: string[];
  resolvers?: Record<string, any>[];
  rolesOptions?: {
    additionalActions?: string[];
    additionalRoles?: Record<string, (role: any, actions: Record<string, string>) => void>;
  };
}

/**
 * Adds the ticketing services, GraphQL schema, actions and the `ticketing` role to startPlatform
 * options, keeping what the project already configured (project entries win on conflicts).
 * Projects that pass their own `schema` must add ticketingTypeDefs and ticketingResolvers to it.
 * With canAccessEvent the `ticketing` role is built by createTicketingRoles({ canAccessEvent });
 * a project that defines its own `ticketing` role passes the scope to createTicketingRoles itself.
 */
export function withTicketing<T extends object>(
  platformOptions: T,
  { canAccessEvent }: WithTicketingOptions = {},
): T {
  const {
    services,
    typeDefs = [],
    resolvers = [],
    rolesOptions,
  } = platformOptions as TicketingPlatformOptions;

  if ('schema' in platformOptions) {
    logger.warn(
      'withTicketing: a custom schema makes the GraphQL server ignore typeDefs and resolvers. Add ticketingTypeDefs and ticketingResolvers to your schema, and build the RoleAction enum after startPlatform so it contains ticketingActions.',
    );
  }

  // A project ticketing role wins, so a scope it was not built with would silently not apply.
  const projectTicketingRole = rolesOptions?.additionalRoles?.ticketing;
  if (
    canAccessEvent &&
    projectTicketingRole &&
    !isTicketingRolesWithScope(projectTicketingRole, canAccessEvent)
  ) {
    throw new Error(
      'withTicketing: rolesOptions.additionalRoles.ticketing is already set, build it with createTicketingRoles({ canAccessEvent }) instead of passing canAccessEvent here',
      { cause: 'TICKETING_SCOPE_CONFLICT' },
    );
  }

  return {
    ...platformOptions,
    services: { ...ticketingServices, ...services },
    typeDefs: [...ticketingTypeDefs.filter((typeDef) => !typeDefs.includes(typeDef)), ...typeDefs],
    resolvers: resolvers.includes(ticketingResolvers) ? resolvers : [ticketingResolvers, ...resolvers],
    rolesOptions: {
      ...rolesOptions,
      additionalActions: [...new Set([...ticketingActions, ...(rolesOptions?.additionalActions || [])])],
      additionalRoles: {
        ticketing: canAccessEvent ? createTicketingRoles({ canAccessEvent }) : configureTicketingRoles,
        ...rolesOptions?.additionalRoles,
      },
    },
  };
}
