import scalars from './scalars.ts';
import directives from './directives.ts';
import types from './types/index.ts';
import inputTypes from './inputTypes.ts';
import query from './query.ts';
import mutation from './mutation.ts';
import { getRegisteredEvents } from '@unchainedshop/events';
import { WorkerDirector, getAllSettingsNamespaces } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');

export const buildDefaultTypeDefs = ({ actions = [] }: { actions: string[] }) => {
  logger.debug(`${actions.length} role actions added to GraphQL schema`, { actions });

  const events = getRegisteredEvents() || [];
  logger.debug(`${events.length} event types added to GraphQL schema`, { events });

  const workTypes = WorkerDirector.getActivePluginTypes() || [];
  logger.debug(`${workTypes.length} work types added to GraphQL schema`, { workTypes });

  const settingsNamespaces = getAllSettingsNamespaces().map((d) => d.key);
  logger.debug(`${settingsNamespaces.length} settings namespaces added to GraphQL schema`, {
    settingsNamespaces,
  });

  const dynamicTypeDefs = [
    actions?.length ? `extend enum RoleAction { ${actions.join(',')} }` : '',
    events?.length ? `extend enum EventType { ${events.join(',')} }` : '',
    workTypes?.length ? `extend enum WorkType { ${workTypes.join(',')} }` : '',
    settingsNamespaces?.length
      ? `extend enum SettingsNamespace { ${settingsNamespaces.join(',')} }`
      : '',
  ].filter(Boolean);

  return [...scalars, ...directives, ...types, ...inputTypes, ...query, ...mutation, ...dynamicTypeDefs];
};
