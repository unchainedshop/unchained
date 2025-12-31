export * from './startPlatform.ts';
export * from './templates/index.ts';

import { MessagingDirector, getAllAdapters } from '@unchainedshop/core';
import { getRegisteredEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';

export const printRuntimeConfiguration = () => {
  const messaging = MessagingDirector.getRegisteredTemplates();
  log(`Messaging Templates: ${messaging.length}`, { messaging });

  const events = getRegisteredEvents();
  log(`Events: ${events.length}`, { events });

  const adapters = getAllAdapters().map((adapter) => adapter.asString());
  log(`Adapters: ${adapters.length}`, { adapters });
};
