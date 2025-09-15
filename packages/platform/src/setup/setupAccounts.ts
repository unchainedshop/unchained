import { UnchainedCore } from '@unchainedshop/core';
import { subscribe } from '@unchainedshop/events';

export const setupAccounts = (unchainedAPI: UnchainedCore) => {
  subscribe('USER_ACCOUNT_ACTION', async ({ payload }: { payload: any }) => {
    await unchainedAPI.services.worker.addMessage('ACCOUNT_ACTION', {
      recipientEmail: payload.address,
      ...payload,
    });
  });
};
