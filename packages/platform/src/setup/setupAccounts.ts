import { UnchainedCore } from '@unchainedshop/core';
import { subscribe } from '@unchainedshop/events';

export const setupAccounts = (unchainedAPI: UnchainedCore) => {
  subscribe('USER_ACCOUNT_ACTION', async ({ payload }: { payload: any }) => {
    await unchainedAPI.modules.worker.addWork({
      type: 'MESSAGE',
      retries: 0,
      input: {
        template: 'ACCOUNT_ACTION',
        recipientEmail: payload.address,
        ...payload,
      },
    });
  });
};
