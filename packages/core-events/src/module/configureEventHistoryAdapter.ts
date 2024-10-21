import { getEmitHistoryAdapter, setEmitHistoryAdapter, EmitAdapter } from '@unchainedshop/events';
import type { RawPayloadType } from '@unchainedshop/events/EventDirector.js';

export const configureEventHistoryAdapter = (
  createFn: ({ type, payload, context }: RawPayloadType<any> & { type: string }) => Promise<unknown>,
) => {
  if (!getEmitHistoryAdapter()) {
    const adapter: EmitAdapter = {
      subscribe: () => {
        // Do nothing
      },
      publish: async (eventName, { payload, context = {} }) => {
        await createFn({
          type: eventName,
          payload,
          context,
        });
      },
    };
    setEmitHistoryAdapter(adapter);
  }
};
