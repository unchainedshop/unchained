import { Collection } from '@unchainedshop/types';
import { Event, EmitAdapter } from '@unchainedshop/types/events';

import { getEmitHistoryAdapter, setEmitHistoryAdapter } from 'meteor/unchained:events';

export const configureEventHistoryAdapter = (Events: Collection<Event>) => {
  if (!getEmitHistoryAdapter()) {
    const adapter: EmitAdapter = {
      subscribe: () => {
        // Do nothing
      },
      publish: async (eventName, payload: any) => {
        await Events.insertOne({
          type: eventName,
          payload,
          context: {},
          created: new Date(),
        });
      },
    };
    setEmitHistoryAdapter(adapter);
  }
};
