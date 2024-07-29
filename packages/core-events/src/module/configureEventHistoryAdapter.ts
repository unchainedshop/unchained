import { ModuleMutations } from '@unchainedshop/core';
import { getEmitHistoryAdapter, setEmitHistoryAdapter, EmitAdapter } from '@unchainedshop/events';
import { Event } from '../db/EventsCollection.js';

export const configureEventHistoryAdapter = (mutations: ModuleMutations<Event>) => {
  if (!getEmitHistoryAdapter()) {
    const adapter: EmitAdapter = {
      subscribe: () => {
        // Do nothing
      },
      publish: async (eventName, { payload, context = {} }) => {
        await mutations.create({
          type: eventName,
          payload,
          context,
        });
      },
    };
    setEmitHistoryAdapter(adapter);
  }
};
