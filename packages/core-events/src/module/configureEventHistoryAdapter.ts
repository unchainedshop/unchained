import { ModuleMutations } from '@unchainedshop/types/core.js';
import { Event, EmitAdapter } from '@unchainedshop/types/events';
import { getEmitHistoryAdapter, setEmitHistoryAdapter } from '@unchainedshop/events';

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
