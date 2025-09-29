import scalars from './scalars.js';
import directives from './directives.js';
import types from './types/index.js';
import inputTypes from './inputTypes.js';
import query from './query.js';
import mutation from './mutation.js';
import { getRegisteredEvents } from '@unchainedshop/events';
import { WorkerDirector } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:api');

export const buildDefaultTypeDefs = ({ actions = [] }: { actions: string[] }) => {
  logger.debug(`${actions.length} role actions added to GraphQL schema`, { actions });

  const events = getRegisteredEvents() || [];
  logger.debug(`${events.length} event types added to GraphQL schema`, { events });

  const workTypes = WorkerDirector.getActivePluginTypes() || [];
  logger.debug(`${workTypes.length} work types added to GraphQL schema`, { workTypes });

  const dynamicTypeDefs = [
    actions?.length ? `extend enum RoleAction { ${actions.join(',')} }` : '',
    events?.length ? `extend enum EventType { ${events.join(',')} }` : '',
    workTypes?.length ? `extend enum WorkType { ${workTypes.join(',')} }` : '',
  ].filter(Boolean);

  return [...scalars, ...directives, ...types, ...inputTypes, ...query, ...mutation, ...dynamicTypeDefs];
};
