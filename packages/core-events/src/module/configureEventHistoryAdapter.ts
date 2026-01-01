import { setEmitHistoryAdapter, type EmitAdapter } from '@unchainedshop/events';
import type { RawPayloadType } from '@unchainedshop/events';

export const configureEventHistoryAdapter = (
  createFn: ({ type, payload }: RawPayloadType<any> & { type: string }) => Promise<unknown>,
) => {
  const adapter: EmitAdapter = {
    subscribe: () => {
      // Do nothing
    },
    publish: async (eventName, { payload }) => {
      await createFn({
        type: eventName,
        payload,
      });
    },
  };
  setEmitHistoryAdapter(adapter);
};
